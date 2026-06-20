import type { Scheduling } from '../types/scheduling';

export type DiffStatus = 'removed' | 'new' | 'unchanged';

export interface DiffRow {
  status: DiffStatus;
  startDate: string;
  endDate: string;
  countries: string[];
  languages: string[];
}

function fingerprint(s: {
  startDate: string;
  endDate: string;
  countries: string[];
  languages: string[];
}): string {
  return [
    s.startDate,
    s.endDate,
    [...s.countries].sort().join(','),
    [...s.languages].sort().join(','),
  ].join('|');
}

export function computeDiff(current: Scheduling[], preview: Scheduling[]): DiffRow[] {
  const currentFps = new Set(current.map(fingerprint));
  const previewFps = new Set(preview.map(fingerprint));

  const rows: DiffRow[] = [];

  for (const s of current) {
    rows.push({
      status: previewFps.has(fingerprint(s)) ? 'unchanged' : 'removed',
      startDate: s.startDate,
      endDate: s.endDate,
      countries: [...s.countries].sort(),
      languages: [...s.languages].sort(),
    });
  }

  for (const s of preview) {
    if (!currentFps.has(fingerprint(s))) {
      rows.push({
        status: 'new',
        startDate: s.startDate,
        endDate: s.endDate,
        countries: [...s.countries].sort(),
        languages: [...s.languages].sort(),
      });
    }
  }

  const order: Record<DiffStatus, number> = { removed: 0, new: 1, unchanged: 2 };
  return rows.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) || order[a.status] - order[b.status],
  );
}
