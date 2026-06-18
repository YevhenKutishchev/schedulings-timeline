export interface Scheduling {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  countries: string[];
  languages: string[];
  createdAt: string;
  updatedAt: string;
}

export type SchedulingDraft = Omit<Scheduling, 'id' | 'createdAt' | 'updatedAt'>;
