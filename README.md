# Schedulings Timeline

A React application for creating, editing, and visualizing **Schedulings** — distribution window definitions that specify when and where content (films, series) can be made available.

---

## To do

* Add action-based editing.
  * Add the possibility to add/remove languages to all active territories in a specified time interval.
  * When users add or remove something, we probably need to give them a hint on what is active on a start date.
  * addToTimeline function's ([docs/SCHEDULING_CONCEPT.md](docs/SCHEDULING_CONCEPT.md)) algorithm doesn't merge territory 
    groups with the same language sets. Decided to not to add it before draft/published statuses added to schedulings.
* Think about a user-friendly way to display diffs. What countries/languages were added/removed on a specific date.
* In the Add to Timeline diff view: decide whether to show REMOVED + NEW rows separately, or try to pair them as MODIFIED (this scheduling was split into these). Currently showing REMOVED + NEW.
* Add status fields (draft/published) to schedulings. At the moment schedulings don't have a status field, so there is no such thing as publishing schedulings.
  * Can we publish draft schedulings that start in the past?

---

## What is a Scheduling?

A **Scheduling** defines a distribution window for a piece of content across a set of territories and languages. It is the source of truth from which **Avails** are derived (Avail generation is out of scope for this app).

For a detailed explanation of normalization rules, edge cases, and the add operation algorithm, see [docs/SCHEDULING_CONCEPT.md](docs/SCHEDULING_CONCEPT.md).

### Data Model

```typescript
interface Scheduling {
  id: string;           // UUID
  startDate: string;    // ISO 8601 date (YYYY-MM-DD)
  endDate: string;      // ISO 8601 date (YYYY-MM-DD)
  countries: string[];  // ISO 3166-1 alpha-2 codes, e.g. ["us", "ca"]
  languages: string[];  // BCP 47 tags, e.g. ["en-us", "es-es"]
  createdAt: string;    // ISO 8601 datetime
  updatedAt: string;    // ISO 8601 datetime
}
```

### Example

A scheduling with `countries: ["us", "ca"]` and `languages: ["en-us", "es-es"]` means the content can be distributed in the United States and Canada in both English and Spanish.

---

## Features

### Phase 1 — CRUD Interface
- Create a new scheduling via a form (date range, country picker, language picker)
- Edit an existing scheduling
- Delete a scheduling
- Form validation (date range integrity, at least one country and one language)

### Phase 2 — Visualization
- **Timeline view** — horizontal time axis; each scheduling is a bar spanning `startDate → endDate`, grouped or color-coded by country or language
- **Table view** — tabular list with sorting and filtering by date range, country, language
- Toggle between views

### Future (out of scope)
- Content (film/series) association
- Avail generation from schedulings
- Backend persistence (currently in-memory / localStorage)

---

## Countries & Languages

Countries follow **ISO 3166-1 alpha-2** codes. Languages follow **BCP 47** tags. Both are selected from predefined fixed lists in the UI.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build tool | Vite 6 |
| Language | TypeScript |
| UI components | Material UI (MUI) v9 |
| Date handling | Day.js |
| State management | React Context + useReducer |
| Persistence | localStorage |

---

## Project Structure

```
src/
  types/
    scheduling.ts           # Scheduling interface and related types
  data/
    countries.ts            # Fixed list of ISO 3166-1 alpha-2 countries
    languages.ts            # Fixed list of BCP 47 language tags
  context/
    SchedulingsContext.tsx  # Context + useReducer (CRUD operations)
  components/
    SchedulingForm/         # Create / Edit form (modal)
    SchedulingTable/        # Table view
    SchedulingTimeline/     # Timeline view
    AppLayout/              # Top bar, navigation
  pages/
    SchedulingsPage.tsx     # Main page — view toggle + list/timeline
  App.tsx
  main.tsx
```

---

## Getting Started

```bash
npm install
npm run dev
```
