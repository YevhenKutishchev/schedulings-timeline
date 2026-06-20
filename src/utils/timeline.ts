import dayjs from 'dayjs';
import type { Scheduling } from '../types/scheduling';

export interface TimelineOperation {
  startDate: string;
  endDate: string;
  countries: string[];
  languages: string[];
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function dayBefore(date: string): string {
  return dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
}

function dayAfter(date: string): string {
  return dayjs(date).add(1, 'day').format('YYYY-MM-DD');
}

function overlaps(s: Scheduling, start: string, end: string): boolean {
  return s.startDate <= end && s.endDate >= start;
}

// ---------------------------------------------------------------------------
// Set helpers (preserve sort order for determinism)
// ---------------------------------------------------------------------------

function setUnion(a: string[], b: string[]): string[] {
  return [...new Set([...a, ...b])].sort();
}

function setDiff(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((x) => !bSet.has(x));
}

function setIntersect(a: string[], b: string[]): string[] {
  const bSet = new Set(b);
  return a.filter((x) => bSet.has(x));
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const aSet = new Set(a);
  return b.every((x) => aSet.has(x));
}

// ---------------------------------------------------------------------------
// Scheduling factory
// ---------------------------------------------------------------------------

function make(
  startDate: string,
  endDate: string,
  countries: string[],
  languages: string[],
): Scheduling {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    startDate,
    endDate,
    countries: [...countries].sort(),
    languages: [...languages].sort(),
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// mergeByPeriod
//
// Schedulings with the same (startDate, endDate, languages) are combined
// into one entry — their countries are unioned.
// Handles cases where an operation produces [br]|[fi] and [ca]|[fi] for
// the same period; they should collapse into a single [br,ca]|[fi] entry.
// ---------------------------------------------------------------------------

function mergeByPeriod(schedulings: Scheduling[]): Scheduling[] {
  const byPeriod = new Map<string, { countries: Set<string>; ref: Scheduling }>();
  for (const s of schedulings) {
    const key = `${s.startDate}|${s.endDate}|${[...s.languages].sort().join(',')}`;
    const existing = byPeriod.get(key);
    if (existing) {
      s.countries.forEach((c) => existing.countries.add(c));
    } else {
      byPeriod.set(key, { countries: new Set(s.countries), ref: s });
    }
  }
  return [...byPeriod.values()].map(({ countries, ref }) =>
    make(ref.startDate, ref.endDate, [...countries], ref.languages),
  );
}

// ---------------------------------------------------------------------------
// mergeAdjacent
//
// Schedulings with the same (countries, languages) whose date ranges are
// consecutive (one ends the day before the next starts) are merged into one.
// ---------------------------------------------------------------------------

function mergeAdjacent(schedulings: Scheduling[]): Scheduling[] {
  const groups = new Map<string, Scheduling[]>();
  for (const s of schedulings) {
    const key = [...s.countries].sort().join(',') + '|' + [...s.languages].sort().join(',');
    const group = groups.get(key);
    if (group) {
      group.push(s);
    } else {
      groups.set(key, [s]);
    }
  }

  const result: Scheduling[] = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => a.startDate.localeCompare(b.startDate));
    let current = { ...sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
      if (dayAfter(current.endDate) === sorted[i].startDate) {
        current = { ...current, endDate: sorted[i].endDate };
      } else {
        result.push(current);
        current = { ...sorted[i] };
      }
    }
    result.push(current);
  }

  return result.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      [...a.countries].sort().join().localeCompare([...b.countries].sort().join()),
  );
}

// ---------------------------------------------------------------------------
// normalize
//
// Applies mergeByPeriod then mergeAdjacent to produce a fully normalized
// scheduling set with no redundant entries.
// ---------------------------------------------------------------------------

function normalize(schedulings: Scheduling[]): Scheduling[] {
  return mergeAdjacent(mergeByPeriod(schedulings));
}

// ---------------------------------------------------------------------------
// addToTimeline
//
// For each overlapping scheduling:
//   - Countries in the operation → languages = union(existing, operation)
//   - Countries not in the operation → unchanged
//   - Scheduling is split at the operation boundaries if needed
//
// Countries in the operation that appear in NO existing scheduling →
// new scheduling with only the operation languages.
// ---------------------------------------------------------------------------

export function addToTimeline(
  schedulings: Scheduling[],
  op: TimelineOperation,
): Scheduling[] {
  const affected = schedulings.filter((s) => overlaps(s, op.startDate, op.endDate));
  const unaffected = schedulings.filter((s) => !overlaps(s, op.startDate, op.endDate));
  const result: Scheduling[] = [];

  for (const s of affected) {
    if (s.startDate < op.startDate) {
      result.push(make(s.startDate, dayBefore(op.startDate), s.countries, s.languages));
    }

    const overlapStart = s.startDate < op.startDate ? op.startDate : s.startDate;
    const overlapEnd = s.endDate > op.endDate ? op.endDate : s.endDate;

    const inOp = setIntersect(s.countries, op.countries);
    const notInOp = setDiff(s.countries, op.countries);

    if (inOp.length > 0) {
      const mergedLangs = setUnion(s.languages, op.languages);
      if (notInOp.length > 0) {
        result.push(make(overlapStart, overlapEnd, notInOp, s.languages));
      }
      result.push(make(overlapStart, overlapEnd, inOp, mergedLangs));
    } else {
      result.push(make(overlapStart, overlapEnd, s.countries, s.languages));
    }

    if (s.endDate > op.endDate) {
      result.push(make(dayAfter(op.endDate), s.endDate, s.countries, s.languages));
    }
  }

  // Countries from the operation absent from all affected schedulings → new entry
  const coveredCountries = new Set(affected.flatMap((s) => s.countries));
  const newCountries = op.countries.filter((c) => !coveredCountries.has(c));
  if (newCountries.length > 0) {
    result.push(make(op.startDate, op.endDate, newCountries, op.languages));
  }

  return normalize([...unaffected, ...result]);
}

// ---------------------------------------------------------------------------
// removeFromTimeline
//
// For each overlapping scheduling:
//   - Countries in the operation → languages = existing \ operation
//     - If remaining languages is empty → country disappears (no entry created)
//   - Countries not in the operation → unchanged
//   - Scheduling is split at the operation boundaries if needed
// ---------------------------------------------------------------------------

export function removeFromTimeline(
  schedulings: Scheduling[],
  op: TimelineOperation,
): Scheduling[] {
  const affected = schedulings.filter((s) => overlaps(s, op.startDate, op.endDate));
  const unaffected = schedulings.filter((s) => !overlaps(s, op.startDate, op.endDate));
  const result: Scheduling[] = [];

  for (const s of affected) {
    if (s.startDate < op.startDate) {
      result.push(make(s.startDate, dayBefore(op.startDate), s.countries, s.languages));
    }

    const overlapStart = s.startDate < op.startDate ? op.startDate : s.startDate;
    const overlapEnd = s.endDate > op.endDate ? op.endDate : s.endDate;

    const inOp = setIntersect(s.countries, op.countries);
    const notInOp = setDiff(s.countries, op.countries);

    if (inOp.length > 0) {
      const remainingLangs = setDiff(s.languages, op.languages);

      if (notInOp.length > 0) {
        result.push(make(overlapStart, overlapEnd, notInOp, s.languages));
      }
      if (remainingLangs.length > 0) {
        result.push(make(overlapStart, overlapEnd, inOp, remainingLangs));
      }
      // else: inOp countries have no languages left → silently removed
    } else {
      result.push(make(overlapStart, overlapEnd, s.countries, s.languages));
    }

    if (s.endDate > op.endDate) {
      result.push(make(dayAfter(op.endDate), s.endDate, s.countries, s.languages));
    }
  }

  return normalize([...unaffected, ...result]);
}

// ---------------------------------------------------------------------------
// Re-export sameSet for consumers that need to check language equality
// ---------------------------------------------------------------------------
export { sameSet };
