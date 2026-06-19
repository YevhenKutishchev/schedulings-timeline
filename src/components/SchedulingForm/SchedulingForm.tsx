import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
} from '@mui/material';
import type { Scheduling, SchedulingDraft } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { MultiAutocomplete } from './MultiAutocomplete';

interface Props {
  open: boolean;
  initial?: Scheduling;
  onClose: () => void;
  onSubmit: (draft: SchedulingDraft) => void;
}

const empty: SchedulingDraft = {
  startDate: '',
  endDate: '',
  countries: [],
  languages: [],
};

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  id: c.code,
  label: `${c.code.toUpperCase()} – ${c.label}`,
}));

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  id: l.tag,
  label: `${l.tag} – ${l.label}`,
}));

export function SchedulingForm({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<SchedulingDraft>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { startDate: initial.startDate, endDate: initial.endDate, countries: initial.countries, languages: initial.languages }
          : empty,
      );
      setErrors({});
    }
  }, [open, initial]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.startDate) e.startDate = 'Required';
    if (!form.endDate) e.endDate = 'Required';
    if (form.startDate && form.endDate && form.startDate > form.endDate)
      e.endDate = 'End date must be after start date';
    if (form.countries.length === 0) e.countries = 'Select at least one country';
    if (form.languages.length === 0) e.languages = 'Select at least one language';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit(form);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit Scheduling' : 'New Scheduling'}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.startDate}
            helperText={errors.startDate}
            fullWidth
          />
          <TextField
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.endDate}
            helperText={errors.endDate}
            fullWidth
          />
          <MultiAutocomplete
            options={COUNTRY_OPTIONS}
            value={form.countries}
            onChange={(ids) => setForm((f) => ({ ...f, countries: ids }))}
            label="Countries"
            error={!!errors.countries}
            helperText={errors.countries}
          />
          <MultiAutocomplete
            options={LANGUAGE_OPTIONS}
            value={form.languages}
            onChange={(ids) => setForm((f) => ({ ...f, languages: ids }))}
            label="Languages"
            error={!!errors.languages}
            helperText={errors.languages}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initial ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
