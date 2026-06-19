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

## Invariants

These rules must always hold across the full set of schedulings for a given piece of content:

1. **No duplicate coverage** — the same country must not appear in two schedulings whose date ranges overlap.
2. **Homogeneous language sets** — all countries within one scheduling share exactly the same languages.
3. **No redundant entries** — two schedulings with the same date range and the same language set should be merged into one.
4. **Contiguous ranges** — if a country's availability is continuous, its schedulings should be mergeable into one (no unnecessary splits).
