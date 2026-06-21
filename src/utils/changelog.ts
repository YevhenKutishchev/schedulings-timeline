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
