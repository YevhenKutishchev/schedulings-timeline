# Scheduling Concept

## Purpose

Schedulings define **when** and **where** a piece of content (film, series episode, etc.) is available, and **in which languages**. They are the source of truth for generating Avails.

For any point in time, a scheduling set must make it unambiguous which countries and languages are active.

---

## Core Rule: Normalization

A scheduling groups countries that share **exactly the same set of languages** during **exactly the same date range**.

> If any country in a group needs a different language set, or a different date range — it must be in a separate scheduling.

This ensures there is **no redundant data**: the same country-language-period combination never appears twice, and every scheduling entry carries unique information.

---

## Data Model

```typescript
interface Scheduling {
  id: string;
  startDate: string;    // YYYY-MM-DD, inclusive
  endDate: string;      // YYYY-MM-DD, inclusive
  countries: string[];  // ISO 3166-1 alpha-2
  languages: string[];  // BCP 47
}
```

---

## Examples

### 1. Adding countries with the same language set → merge into existing

**Initial state:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  }
]
```

**Operation:** Add `de` and `fr` from `2027-01-01` with the same languages `["ar", "cs"]`.

**Result:** Simply add them to the existing scheduling — no new entry needed.
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at", "de", "fr"],
    "languages": ["ar", "cs"]
  }
]
```

---

### 2. Adding countries with a different language set → new scheduling

**Initial state:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  }
]
```

**Operation:** Add `de` and `fr` from `2027-01-01`, but they should only have `cs` (not `ar`).

**Result:** A new scheduling is required because the language set differs.
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  },
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["de", "fr"],
    "languages": ["cs"]
  }
]
```

---

### 3. Removing a language from one country → split scheduling

**Initial state:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  }
]
```

**Operation:** Starting `2028-01-01`, remove language `cs` from `au`.

**Result:** The original scheduling is deleted. Three schedulings replace it:
- The shared period before the change (all countries, all languages)
- After the change: `ar` and `at` continue unchanged
- After the change: `au` with only `ar`

```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2027-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  },
  {
    "startDate": "2028-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "at"],
    "languages": ["ar", "cs"]
  },
  {
    "startDate": "2028-01-01",
    "endDate": "2100-12-31",
    "countries": ["au"],
    "languages": ["ar"]
  }
]
```

---

### 4. Adding a language to one country → split scheduling

**Initial state:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  }
]
```

**Operation:** Starting `2029-06-01`, add language `en-gb` to `au` only.

**Result:** Three schedulings:
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2029-05-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  },
  {
    "startDate": "2029-06-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "at"],
    "languages": ["ar", "cs"]
  },
  {
    "startDate": "2029-06-01",
    "endDate": "2100-12-31",
    "countries": ["au"],
    "languages": ["ar", "cs", "en-gb"]
  }
]
```

---

### 5. Removing a country entirely → remove from scheduling

**Initial state:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  }
]
```

**Operation:** Remove `au` entirely (no longer available at any time).

**Result:** Simply remove `au` from the countries list.
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "at"],
    "languages": ["ar", "cs"]
  }
]
```

If `au` was the only country in a scheduling, the entire scheduling is deleted.

---

### 6. Removing a country from a specific date → split scheduling

**Initial state:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  }
]
```

**Operation:** Starting `2030-01-01`, `au` is no longer available (in any language).

**Result:**
```json
[
  {
    "startDate": "2027-01-01",
    "endDate": "2029-12-31",
    "countries": ["ar", "au", "at"],
    "languages": ["ar", "cs"]
  },
  {
    "startDate": "2030-01-01",
    "endDate": "2100-12-31",
    "countries": ["ar", "at"],
    "languages": ["ar", "cs"]
  }
]
```

---

### 7. Adding languages to existing and new countries simultaneously → different results per country

**Initial state:**
```json
[
  { "startDate": "2026-01-01", "endDate": "2100-12-31", "countries": ["us", "ca"], "languages": ["en-us"] }
]
```

**Operation:** Add `[us, gb]` with `["es"]` from `2026-01-01` to `2100-12-31`

- `us` is **existing** → `union(["en-us"], ["es"])` = `["en-us", "es"]`
- `gb` is **new** → only `["es"]` (no prior languages to merge with)
- `ca` is not in the operation → keeps `["en-us"]` unchanged

`us` and `gb` end up with different language sets and cannot share a scheduling:

```json
[
  { "startDate": "2026-01-01", "endDate": "2100-12-31", "countries": ["ca"], "languages": ["en-us"] },
  { "startDate": "2026-01-01", "endDate": "2100-12-31", "countries": ["us"], "languages": ["en-us", "es"] },
  { "startDate": "2026-01-01", "endDate": "2100-12-31", "countries": ["gb"], "languages": ["es"] }
]
```

---

### 8. Removing a language from multiple countries where some lose all languages → country disappears

**Initial state:**
```json
[
  { "startDate": "2026-01-01", "endDate": "2100-12-31", "countries": ["us", "ca"], "languages": ["en-us", "es"] },
  { "startDate": "2026-01-01", "endDate": "2100-12-31", "countries": ["mx"],       "languages": ["es"] }
]
```

**Operation:** Remove language `["es"]` from `["us", "ca", "mx"]` starting `2027-01-01`.

- `us`, `ca` → `["en-us", "es"] \ ["es"]` = `["en-us"]` — still have languages, remain active
- `mx` → `["es"] \ ["es"]` = `[]` — no languages left, country disappears entirely

```json
[
  { "startDate": "2026-01-01", "endDate": "2026-12-31", "countries": ["us", "ca"], "languages": ["en-us", "es"] },
  { "startDate": "2026-01-01", "endDate": "2026-12-31", "countries": ["mx"],       "languages": ["es"] },
  { "startDate": "2027-01-01", "endDate": "2100-12-31", "countries": ["us", "ca"], "languages": ["en-us"] }
]
```

`mx` produces no entry from `2027-01-01` onwards — it simply ceases to exist.

---

## Add Operation Algorithm

Adds countries with a given set of languages to the timeline for a specified date range.
Existing schedulings that overlap are automatically split and merged as needed.

### Key distinction

- **Existing country** in an overlapping scheduling → gets `union(existing_languages, operation_languages)`
- **New country** (not in any overlapping scheduling) → gets only `operation_languages`

See **Example 7** for an illustration of why this distinction matters.

### Pseudocode

```
addToTimeline(schedulings, { startDate, endDate, countries, languages }):

  affected   = schedulings that overlap [startDate, endDate]
  unaffected = the rest (unchanged)
  result     = []

  for each S in affected:

    // Part BEFORE the operation — unchanged
    if S.startDate < startDate:
      result.push({ ...S, endDate: startDate - 1day })

    overlapStart = max(S.startDate, startDate)
    overlapEnd   = min(S.endDate, endDate)

    inOperation    = S.countries ∩ countries   // exist in both S and the operation
    notInOperation = S.countries \ countries   // only in S

    if inOperation is not empty:
      mergedLangs = union(S.languages, languages)
      if notInOperation is not empty:
        // Countries outside the operation keep their original languages
        result.push({ overlapStart, overlapEnd, countries: notInOperation, languages: S.languages })
      result.push({ overlapStart, overlapEnd, countries: inOperation, languages: mergedLangs })
    else:
      // No countries from the operation in this scheduling — unchanged
      result.push({ overlapStart, overlapEnd, countries: S.countries, languages: S.languages })

    // Part AFTER the operation — unchanged
    if S.endDate > endDate:
      result.push({ ...S, startDate: endDate + 1day })

  // Countries from the operation not present in any affected scheduling
  coveredCountries = union of all countries across affected schedulings
  newCountries     = countries \ coveredCountries
  if newCountries is not empty:
    result.push({ startDate, endDate, countries: newCountries, languages })

  // Merge adjacent schedulings with identical countries and languages
  result = mergeAdjacent([...unaffected, ...result])

  return result
```

`mergeAdjacent`: if two schedulings have the same `countries` and `languages`, and one ends the day before the other starts — combine them into one.

---

## Remove Operation Algorithm

Removes specified languages from specified countries for a given date range.
If a country ends up with no languages remaining, it is dropped entirely from that period.

### Key distinction

Unlike `addToTimeline`, there is no "new country" case — removing from a country that has no existing scheduling for that period is a no-op.

When `remainingLangs` is empty for a country → that country simply produces no output entry (silently removed). See **Example 8**.

### Pseudocode

```
removeFromTimeline(schedulings, { startDate, endDate, countries, languages }):

  affected   = schedulings that overlap [startDate, endDate]
  unaffected = the rest (unchanged)
  result     = []

  for each S in affected:

    // Part BEFORE the operation — unchanged
    if S.startDate < startDate:
      result.push({ ...S, endDate: startDate - 1day })

    overlapStart = max(S.startDate, startDate)
    overlapEnd   = min(S.endDate, endDate)

    inOperation    = S.countries ∩ countries   // exist in both S and the operation
    notInOperation = S.countries \ countries   // only in S, not affected

    if inOperation is not empty:
      remainingLangs = S.languages \ languages  // languages that survive the removal

      // Countries outside the operation always keep their languages
      if notInOperation is not empty:
        result.push({ overlapStart, overlapEnd, countries: notInOperation, languages: S.languages })

      if remainingLangs is not empty:
        // Some languages remain — countries stay with a reduced set
        result.push({ overlapStart, overlapEnd, countries: inOperation, languages: remainingLangs })
      // else: remainingLangs is empty → inOperation countries disappear entirely,
      //       no entry is created for them

    else:
      // No countries from the operation in this scheduling — unchanged
      result.push({ overlapStart, overlapEnd, countries: S.countries, languages: S.languages })

    // Part AFTER the operation — unchanged
    if S.endDate > endDate:
      result.push({ ...S, startDate: endDate + 1day })

  // Merge adjacent schedulings with identical countries and languages
  result = mergeAdjacent([...unaffected, ...result])

  return result
```

---

## Invariants

These rules must always hold across the full set of schedulings for a given piece of content:

1. **No duplicate coverage** — the same country must not appear in two schedulings whose date ranges overlap.
2. **Homogeneous language sets** — all countries within one scheduling share exactly the same languages.
3. **No redundant entries** — two schedulings with the same date range and the same language set should be merged into one.
4. **Contiguous ranges** — if a country's availability is continuous, its schedulings should be mergeable into one (no unnecessary splits).
