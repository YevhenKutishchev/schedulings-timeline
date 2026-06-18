import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Scheduling, SchedulingDraft } from '../types/scheduling';

const STORAGE_KEY = 'schedulings';

function loadFromStorage(): Scheduling[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Scheduling[];
  } catch {
    // ignore corrupt storage
  }
  return [];
}

type Action =
  | { type: 'ADD'; payload: SchedulingDraft }
  | { type: 'UPDATE'; payload: { id: string } & SchedulingDraft }
  | { type: 'DELETE'; payload: string }
  | { type: 'RESET'; payload: Scheduling[] };

function reducer(state: Scheduling[], action: Action): Scheduling[] {
  switch (action.type) {
    case 'ADD': {
      const now = new Date().toISOString();
      const newItem: Scheduling = {
        ...action.payload,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      return [...state, newItem];
    }
    case 'UPDATE':
      return state.map((s) =>
        s.id === action.payload.id
          ? { ...s, ...action.payload, updatedAt: new Date().toISOString() }
          : s,
      );
    case 'DELETE':
      return state.filter((s) => s.id !== action.payload);
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
}

interface SchedulingsContextValue {
  schedulings: Scheduling[];
  add: (draft: SchedulingDraft) => void;
  update: (id: string, draft: SchedulingDraft) => void;
  remove: (id: string) => void;
  reset: (items: Scheduling[]) => void;
}

const SchedulingsContext = createContext<SchedulingsContextValue | null>(null);

export function SchedulingsProvider({ children }: { children: ReactNode }) {
  const [schedulings, dispatch] = useReducer(reducer, undefined, loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedulings));
  }, [schedulings]);

  const add = (draft: SchedulingDraft) => dispatch({ type: 'ADD', payload: draft });
  const update = (id: string, draft: SchedulingDraft) =>
    dispatch({ type: 'UPDATE', payload: { id, ...draft } });
  const remove = (id: string) => dispatch({ type: 'DELETE', payload: id });
  const reset = (items: Scheduling[]) => dispatch({ type: 'RESET', payload: items });

  return (
    <SchedulingsContext value={{ schedulings, add, update, remove, reset }}>
      {children}
    </SchedulingsContext>
  );
}

export function useSchedulings() {
  const ctx = useContext(SchedulingsContext);
  if (!ctx) throw new Error('useSchedulings must be used within SchedulingsProvider');
  return ctx;
}
