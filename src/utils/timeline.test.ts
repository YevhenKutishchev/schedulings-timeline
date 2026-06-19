import { describe, it, expect } from 'vitest';
import { addToTimeline, removeFromTimeline } from './timeline';
import type { Scheduling } from '../types/scheduling';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TS = '2025-01-01T00:00:00.000Z';

function mk(
  startDate: string,
  endDate: string,
  countries: string[],
  languages: string[],
): Scheduling {
  return {
    id: crypto.randomUUID(),
    startDate,
    endDate,
    countries,
    languages,
    createdAt: TS,
    updatedAt: TS,
  };
}

/** Compare schedulings ignoring id and timestamps. */
function norm(schedulings: Scheduling[]) {
  return schedulings
    .map(({ startDate, endDate, countries, languages }) => ({
      startDate,
      endDate,
      countries: [...countries].sort(),
      languages: [...languages].sort(),
    }))
    .sort((a, b) => {
      const d = a.startDate.localeCompare(b.startDate);
      return d !== 0 ? d : a.countries.join().localeCompare(b.countries.join());
    });
}

// ---------------------------------------------------------------------------
// addToTimeline
// ---------------------------------------------------------------------------

describe('addToTimeline', () => {
  it('adds new countries not present in any scheduling (doc Example A)', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us'])];
    const result = addToTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['ca', 'mx'],
      languages: ['en-us', 'es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
      mk('2026-01-01', '2100-12-31', ['ca', 'mx'], ['en-us', 'es']),
    ]));
  });

  it('merges languages for an existing country', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us', 'ca'], ['en-us'])];
    const result = addToTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['ca'], ['en-us']),
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
    ]));
  });

  it('does not duplicate a language already present', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es'])];
    const result = addToTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
    ]));
  });

  // doc Example 7
  it('existing country gets language union; new country gets only operation languages', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us', 'ca'], ['en-us'])];
    const result = addToTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us', 'gb'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['ca'], ['en-us']),
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
      mk('2026-01-01', '2100-12-31', ['gb'], ['es']),
    ]));
  });

  // doc Example C (partial date overlap)
  it('splits an existing scheduling on partial date overlap', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us'])];
    const result = addToTimeline(initial, {
      startDate: '2027-01-01',
      endDate: '2028-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2026-12-31', ['us'], ['en-us']),
      mk('2027-01-01', '2028-12-31', ['us'], ['en-us', 'es']),
      mk('2029-01-01', '2100-12-31', ['us'], ['en-us']),
    ]));
  });

  it('merges adjacent schedulings with identical data after operation', () => {
    // Two adjacent [us][en-us] schedulings + add [ca] in the middle period.
    // The [us] schedulings should be merged back by mergeAdjacent.
    const initial = [
      mk('2026-01-01', '2026-12-31', ['us'], ['en-us']),
      mk('2027-01-01', '2100-12-31', ['us'], ['en-us']),
    ];
    const result = addToTimeline(initial, {
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      countries: ['ca'],
      languages: ['fr-ca'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
      mk('2027-01-01', '2027-12-31', ['ca'], ['fr-ca']),
    ]));
  });

  it('works on an empty scheduling list', () => {
    const result = addToTimeline([], {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us'],
      languages: ['en-us'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
    ]));
  });

  it('leaves schedulings outside the operation period untouched', () => {
    const initial = [
      mk('2024-01-01', '2024-12-31', ['us'], ['en-us']),
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
    ];
    const result = addToTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2024-01-01', '2024-12-31', ['us'], ['en-us']),
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
    ]));
  });
});

// ---------------------------------------------------------------------------
// removeFromTimeline
// ---------------------------------------------------------------------------

describe('removeFromTimeline', () => {
  // doc Example 3
  it('removes a language from one country starting from a date', () => {
    const initial = [mk('2027-01-01', '2100-12-31', ['ar', 'au', 'at'], ['ar', 'cs'])];
    const result = removeFromTimeline(initial, {
      startDate: '2028-01-01',
      endDate: '2100-12-31',
      countries: ['au'],
      languages: ['cs'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2027-01-01', '2027-12-31', ['ar', 'au', 'at'], ['ar', 'cs']),
      mk('2028-01-01', '2100-12-31', ['ar', 'at'], ['ar', 'cs']),
      mk('2028-01-01', '2100-12-31', ['au'], ['ar']),
    ]));
  });

  // doc Example 8
  it('country disappears entirely when all its languages are removed', () => {
    const initial = [
      mk('2026-01-01', '2100-12-31', ['us', 'ca'], ['en-us', 'es']),
      mk('2026-01-01', '2100-12-31', ['mx'], ['es']),
    ];
    const result = removeFromTimeline(initial, {
      startDate: '2027-01-01',
      endDate: '2100-12-31',
      countries: ['us', 'ca', 'mx'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2026-12-31', ['us', 'ca'], ['en-us', 'es']),
      mk('2026-01-01', '2026-12-31', ['mx'], ['es']),
      mk('2027-01-01', '2100-12-31', ['us', 'ca'], ['en-us']),
    ]));
  });

  // doc Example 5 (via remove algorithm)
  it('removes a country entirely by removing all its languages', () => {
    const initial = [mk('2027-01-01', '2100-12-31', ['ar', 'au', 'at'], ['ar', 'cs'])];
    const result = removeFromTimeline(initial, {
      startDate: '2027-01-01',
      endDate: '2100-12-31',
      countries: ['au'],
      languages: ['ar', 'cs'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2027-01-01', '2100-12-31', ['ar', 'at'], ['ar', 'cs']),
    ]));
  });

  it('splits a scheduling on partial date overlap', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es'])];
    const result = removeFromTimeline(initial, {
      startDate: '2027-01-01',
      endDate: '2028-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2026-12-31', ['us'], ['en-us', 'es']),
      mk('2027-01-01', '2028-12-31', ['us'], ['en-us']),
      mk('2029-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
    ]));
  });

  it('is a no-op when the language does not exist in the scheduling', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us'])];
    const result = removeFromTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
    ]));
  });

  it('is a no-op when the country does not exist in any scheduling', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us'])];
    const result = removeFromTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['de'],
      languages: ['en-us'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
    ]));
  });

  it('merges adjacent schedulings with identical data after operation', () => {
    const initial = [mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es'])];
    // Remove from a country that doesn't exist — scheduling splits and merges back
    const result = removeFromTimeline(initial, {
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      countries: ['ca'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
    ]));
  });

  it('leaves schedulings outside the operation period untouched', () => {
    const initial = [
      mk('2024-01-01', '2024-12-31', ['us'], ['en-us', 'es']),
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us', 'es']),
    ];
    const result = removeFromTimeline(initial, {
      startDate: '2026-01-01',
      endDate: '2100-12-31',
      countries: ['us'],
      languages: ['es'],
    });
    expect(norm(result)).toEqual(norm([
      mk('2024-01-01', '2024-12-31', ['us'], ['en-us', 'es']),
      mk('2026-01-01', '2100-12-31', ['us'], ['en-us']),
    ]));
  });
});
