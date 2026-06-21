import type { Scheduling } from '../types/scheduling';

export function applyFilters(
  schedulings: Scheduling[],
  filterCountries: string[],
  filterLanguages: string[],
): Scheduling[] {
  if (filterCountries.length === 0 && filterLanguages.length === 0) return schedulings;

  return schedulings.filter((s) => {
    const hasCountry =
      filterCountries.length === 0 || s.countries.some((c) => filterCountries.includes(c));
    const hasLanguage =
      filterLanguages.length === 0 || s.languages.some((l) => filterLanguages.includes(l));
    return hasCountry && hasLanguage;
  });
}

/** Returns the subset of items that pass the filter, and how many were hidden. */
export function filterItems(
  items: string[],
  filter: string[],
): { visible: string[]; hiddenCount: number } {
  if (filter.length === 0) return { visible: items, hiddenCount: 0 };
  const visible = items.filter((i) => filter.includes(i));
  return { visible, hiddenCount: items.length - visible.length };
}
