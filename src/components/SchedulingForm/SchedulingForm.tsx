import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Autocomplete,
  Chip,
} from '@mui/material';
import type { Scheduling, SchedulingDraft } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';

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
          <Autocomplete
            multiple
            options={COUNTRIES}
            getOptionLabel={(o) => o.label}
            value={COUNTRIES.filter((c) => form.countries.includes(c.code))}
            onChange={(_, value) =>
              setForm((f) => ({ ...f, countries: value.map((v) => v.code) }))
            }
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={`${option.code.toUpperCase()} – ${option.label}`}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.code}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Countries"
                error={!!errors.countries}
                helperText={errors.countries}
              />
            )}
          />
          <Autocomplete
            multiple
            options={LANGUAGES}
            getOptionLabel={(o) => o.label}
            value={LANGUAGES.filter((l) => form.languages.includes(l.tag))}
            onChange={(_, value) =>
              setForm((f) => ({ ...f, languages: value.map((v) => v.tag) }))
            }
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={`${option.tag} – ${option.label}`}
                  size="small"
                  {...getTagProps({ index })}
                  key={option.tag}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Languages"
                error={!!errors.languages}
                helperText={errors.languages}
              />
            )}
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
