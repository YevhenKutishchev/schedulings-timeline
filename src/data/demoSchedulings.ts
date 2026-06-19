import type { Scheduling } from '../types/scheduling';

export interface DemoSet {
  name: string;
  schedulings: Scheduling[];
}

const ts = '2025-12-01T00:00:00.000Z';

export const DEMO_SETS: DemoSet[] = [
  {
    name: 'FTLUNC0001',
    schedulings: [
      { id: 'na-1', startDate: '2026-01-01', endDate: '2026-06-30', countries: ['us', 'ca'], languages: ['en-us', 'es-us'], createdAt: ts, updatedAt: ts },
      { id: 'na-2', startDate: '2026-04-01', endDate: '2026-12-31', countries: ['us'], languages: ['en-us'], createdAt: ts, updatedAt: ts },
      { id: 'na-3', startDate: '2026-07-01', endDate: '2027-06-30', countries: ['ca'], languages: ['en-us', 'fr-ca'], createdAt: ts, updatedAt: ts },
      { id: 'na-4', startDate: '2025-11-01', endDate: '2026-05-31', countries: ['mx'], languages: ['es-419'], createdAt: ts, updatedAt: ts },
      { id: 'na-5', startDate: '2026-03-01', endDate: '2026-09-30', countries: ['us', 'ca', 'mx'], languages: ['en-us', 'es-us', 'fr-ca'], createdAt: ts, updatedAt: ts },
    ],
  },
  {
    name: 'Europe',
    schedulings: [
      { id: 'eu-1', startDate: '2026-01-01', endDate: '2026-12-31', countries: ['gb', 'ie'], languages: ['en-gb'], createdAt: ts, updatedAt: ts },
      { id: 'eu-2', startDate: '2026-03-01', endDate: '2026-09-30', countries: ['de', 'at', 'ch'], languages: ['de'], createdAt: ts, updatedAt: ts },
      { id: 'eu-3', startDate: '2026-02-01', endDate: '2026-08-31', countries: ['fr', 'be'], languages: ['fr-fr'], createdAt: ts, updatedAt: ts },
      { id: 'eu-4', startDate: '2025-11-01', endDate: '2026-06-30', countries: ['es', 'pt'], languages: ['es-es', 'pt-pt'], createdAt: ts, updatedAt: ts },
      { id: 'eu-5', startDate: '2026-05-01', endDate: '2026-12-31', countries: ['it', 'gr'], languages: ['it'], createdAt: ts, updatedAt: ts },
      { id: 'eu-6', startDate: '2026-04-01', endDate: '2027-03-31', countries: ['pl', 'cz', 'ro', 'hu'], languages: ['pl', 'cs', 'ro', 'hu'], createdAt: ts, updatedAt: ts },
    ],
  },
  {
    name: 'Asia Pacific',
    schedulings: [
      { id: 'ap-1', startDate: '2026-01-01', endDate: '2026-06-30', countries: ['jp'], languages: ['ja'], createdAt: ts, updatedAt: ts },
      { id: 'ap-2', startDate: '2026-03-01', endDate: '2026-12-31', countries: ['kr'], languages: ['ko'], createdAt: ts, updatedAt: ts },
      { id: 'ap-3', startDate: '2026-06-01', endDate: '2027-05-31', countries: ['au', 'nz'], languages: ['en-au'], createdAt: ts, updatedAt: ts },
      { id: 'ap-4', startDate: '2026-02-01', endDate: '2026-10-31', countries: ['cn'], languages: ['zh-cn'], createdAt: ts, updatedAt: ts },
      { id: 'ap-5', startDate: '2026-04-01', endDate: '2026-12-31', countries: ['sg', 'hk', 'tw'], languages: ['zh-tw', 'en-us'], createdAt: ts, updatedAt: ts },
      { id: 'ap-6', startDate: '2025-12-01', endDate: '2026-07-31', countries: ['in', 'id', 'th'], languages: ['hi', 'id', 'th'], createdAt: ts, updatedAt: ts },
    ],
  },
  {
    name: 'Global Mix',
    schedulings: [
      { id: 'gl-1', startDate: '2026-01-01', endDate: '2026-06-30', countries: ['us', 'ca'], languages: ['en-us', 'es-us'], createdAt: ts, updatedAt: ts },
      { id: 'gl-2', startDate: '2026-03-01', endDate: '2026-09-30', countries: ['gb', 'ie'], languages: ['en-gb'], createdAt: ts, updatedAt: ts },
      { id: 'gl-3', startDate: '2026-04-15', endDate: '2026-12-31', countries: ['de', 'at', 'ch'], languages: ['de'], createdAt: ts, updatedAt: ts },
      { id: 'gl-4', startDate: '2026-02-01', endDate: '2026-07-31', countries: ['fr', 'be'], languages: ['fr-fr'], createdAt: ts, updatedAt: ts },
      { id: 'gl-5', startDate: '2025-11-01', endDate: '2026-04-30', countries: ['es', 'pt'], languages: ['es-es', 'pt-pt'], createdAt: ts, updatedAt: ts },
      { id: 'gl-6', startDate: '2026-06-01', endDate: '2026-11-30', countries: ['au', 'nz'], languages: ['en-au'], createdAt: ts, updatedAt: ts },
      { id: 'gl-7', startDate: '2026-01-15', endDate: '2026-08-15', countries: ['br'], languages: ['pt-br'], createdAt: ts, updatedAt: ts },
      { id: 'gl-8', startDate: '2026-05-01', endDate: '2027-01-31', countries: ['jp', 'kr'], languages: ['ja', 'ko'], createdAt: ts, updatedAt: ts },
    ],
  },
];
