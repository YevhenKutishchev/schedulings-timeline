import dayjs from 'dayjs';
import type { Scheduling } from '../types/scheduling';

// Maps each country to the set of languages currently available for it.
type StateMap = Map<string, Set<string>>;

function getStateAt(schedulings: Scheduling[], date: string): StateMap {
  const state: StateMap = new Map();
  for (const s of schedulings) {
    if (s.startDate <= date && s.endDate >= date) {
      for (const country of s.countries) {
        const langs = state.get(country) ?? new Set<string>();
        s.languages.forEach((l) => langs.add(l));
        state.set(country, langs);
      }
    }
  }
  return state;
}

export interface ChangeRow {
  type: 'added' | 'removed';
  countries: string[];
  languages: string[];
}

export interface ChangeEvent {
  date: string;
  rows: ChangeRow[];
}

// Groups countries by the set of languages they gained or lost, so countries
// with an identical change appear on one row instead of separate rows.
function diffStates(prev: StateMap, curr: StateMap): ChangeRow[] {
  const addedGroups = new Map<string, string[]>();   // sorted-lang-key → countries
  const removedGroups = new Map<string, string[]>();

  const allCountries = new Set([...prev.keys(), ...curr.keys()]);

  for (const country of allCountries) {
    const prevLangs = prev.get(country) ?? new Set<string>();
    const currLangs = curr.get(country) ?? new Set<string>();

    const addedLangs = [...currLangs].filter((l) => !prevLangs.has(l)).sort();
    const removedLangs = [...prevLangs].filter((l) => !currLangs.has(l)).sort();

    if (addedLangs.length > 0) {
      const key = addedLangs.join(',');
      const group = addedGroups.get(key) ?? [];
      group.push(country);
      addedGroups.set(key, group);
    }

    if (removedLangs.length > 0) {
      const key = removedLangs.join(',');
      const group = removedGroups.get(key) ?? [];
      group.push(country);
      removedGroups.set(key, group);
    }
  }

  const rows: ChangeRow[] = [];
  for (const [key, countries] of addedGroups) {
    rows.push({ type: 'added', countries: countries.sort(), languages: key.split(',') });
  }
  for (const [key, countries] of removedGroups) {
    rows.push({ type: 'removed', countries: countries.sort(), languages: key.split(',') });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// V2: four distinct change types
// ---------------------------------------------------------------------------

export type ChangeTypeV2 =
  | 'country_activated'    // country became active for the first time (with these languages)
  | 'country_deactivated'  // country became fully inactive (had these languages before)
  | 'languages_added'      // country was already active and gained these languages
  | 'languages_removed';   // country was already active and lost these languages (still active)

export interface CountryDiff {
  country: string;
  langsBefore: number; // language count before this event
  langsAfter: number;  // language count after this event
}

export interface ChangeRowV2 {
  type: ChangeTypeV2;
  countries: string[];       // sorted list for display / grouping
  countryDiffs: CountryDiff[]; // per-country before/after counts for the diff view
  languages: string[];
}

export interface ChangeEventV2 {
  date: string;
  rows: ChangeRowV2[];
}

function diffStatesV2(prev: StateMap, curr: StateMap): ChangeRowV2[] {
  const groups = new Map<string, { type: ChangeTypeV2; diffs: CountryDiff[] }>();

  const allCountries = new Set([...prev.keys(), ...curr.keys()]);

  for (const country of allCountries) {
    const prevLangs = prev.get(country) ?? new Set<string>();
    const currLangs = curr.get(country) ?? new Set<string>();

    const wasActive = prevLangs.size > 0;
    const isActive  = currLangs.size > 0;

    const push = (type: ChangeTypeV2, langs: string[]) => {
      const key = `${type}|${[...langs].sort().join(',')}`;
      const g = groups.get(key) ?? { type, diffs: [] };
      g.diffs.push({ country, langsBefore: prevLangs.size, langsAfter: currLangs.size });
      groups.set(key, g);
    };

    if (!wasActive && isActive) {
      push('country_activated', [...currLangs].sort());
    } else if (wasActive && !isActive) {
      push('country_deactivated', [...prevLangs].sort());
    } else if (wasActive && isActive) {
      const addedLangs   = [...currLangs].filter((l) => !prevLangs.has(l)).sort();
      const removedLangs = [...prevLangs].filter((l) => !currLangs.has(l)).sort();
      if (addedLangs.length   > 0) push('languages_added',   addedLangs);
      if (removedLangs.length > 0) push('languages_removed', removedLangs);
    }
  }

  const order: Record<ChangeTypeV2, number> = {
    country_activated:   0,
    languages_added:     1,
    languages_removed:   2,
    country_deactivated: 3,
  };

  return [...groups.entries()]
    .map(([key, { type, diffs }]) => {
      const sorted = [...diffs].sort((a, b) => a.country.localeCompare(b.country));
      return {
        type,
        countries: sorted.map((d) => d.country),
        countryDiffs: sorted,
        languages: key.split('|')[1].split(',').filter(Boolean),
      };
    })
    .sort((a, b) => order[a.type] - order[b.type]);
}

export function computeChangeEventsV2(schedulings: Scheduling[]): ChangeEventV2[] {
  if (schedulings.length === 0) return [];

  const dates = new Set<string>();
  for (const s of schedulings) {
    dates.add(s.startDate);
    dates.add(dayjs(s.endDate).add(1, 'day').format('YYYY-MM-DD'));
  }

  const events: ChangeEventV2[] = [];
  let prevState: StateMap = new Map();

  for (const date of [...dates].sort()) {
    const currState = getStateAt(schedulings, date);
    const rows = diffStatesV2(prevState, currState);
    if (rows.length > 0) {
      events.push({ date, rows });
    }
    prevState = currState;
  }

  return events;
}

export function computeChangeEvents(schedulings: Scheduling[]): ChangeEvent[] {
  if (schedulings.length === 0) return [];

  // Collect every date where the active state can change:
  // a scheduling's startDate, or the day after its endDate.
  const dates = new Set<string>();
  for (const s of schedulings) {
    dates.add(s.startDate);
    dates.add(dayjs(s.endDate).add(1, 'day').format('YYYY-MM-DD'));
  }

  const events: ChangeEvent[] = [];
  let prevState: StateMap = new Map();

  for (const date of [...dates].sort()) {
    const currState = getStateAt(schedulings, date);
    const rows = diffStates(prevState, currState);
    if (rows.length > 0) {
      events.push({ date, rows });
    }
    prevState = currState;
  }

  return events;
}
