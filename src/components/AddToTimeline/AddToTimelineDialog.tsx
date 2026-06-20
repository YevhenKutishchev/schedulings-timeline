import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { MultiAutocomplete } from '../SchedulingForm/MultiAutocomplete';
import { DEFAULT_END_DATE } from '../../constants';
import { addToTimeline, type TimelineOperation } from '../../utils/timeline';
import { computeDiff, type DiffRow, type DiffStatus } from '../../utils/diff';

const today = () => new Date().toISOString().split('T')[0];

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  id: c.code,
  label: `${c.code.toUpperCase()} – ${c.label}`,
}));

const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({
  id: l.tag,
  label: `${l.tag} – ${l.label}`,
}));

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

interface Props {
  open: boolean;
  schedulings: Scheduling[];
  onClose: () => void;
  onApply: (result: Scheduling[]) => void;
}

interface FormState {
  startDate: string;
  endDate: string;
  countries: string[];
  languages: string[];
}

const emptyForm = (): FormState => ({
  startDate: today(),
  endDate: DEFAULT_END_DATE,
  countries: [],
  languages: [],
});

const STATUS_CHIP: Record<DiffStatus, { label: string; color: 'error' | 'success' | 'default' }> =
  {
    removed:   { label: 'REMOVED',   color: 'error' },
    new:       { label: 'NEW',       color: 'success' },
    unchanged: { label: 'UNCHANGED', color: 'default' },
  };

function ChipList({ items, max = 5 }: { items: string[]; max?: number }) {
  const visible = items.slice(0, max);
  const rest = items.length - max;
  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      {visible.map((item) => (
        <Chip key={item} label={item} size="small" variant="outlined" />
      ))}
      {rest > 0 && <Chip label={`+${rest}`} size="small" variant="outlined" />}
    </Stack>
  );
}

export function AddToTimelineDialog({ open, schedulings, onClose, onApply }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [diff, setDiff] = useState<DiffRow[]>([]);
  const [preview, setPreview] = useState<Scheduling[]>([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm(emptyForm());
      setErrors({});
    }
  }, [open]);

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

  function handlePreview() {
    if (!validate()) return;
    const op: TimelineOperation = {
      startDate: form.startDate,
      endDate: form.endDate,
      countries: form.countries,
      languages: form.languages,
    };
    const result = addToTimeline(schedulings, op);
    setPreview(result);
    setDiff(computeDiff(schedulings, result));
    setStep(2);
  }

  function handleApply() {
    onApply(preview);
  }

  const visibleRows = diff.filter((r) => r.status !== 'unchanged');
  const unchangedCount = diff.filter((r) => r.status === 'unchanged').length;
  const hasChanges = visibleRows.length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {step === 1 ? 'Add Expansion' : 'Preview Changes'}
      </DialogTitle>

      <DialogContent dividers>
        {step === 1 && (
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: {
                  min: today(),
                  ...(form.endDate ? { max: form.endDate } : {}),
                },
              }}
              error={!!errors.startDate}
              helperText={errors.startDate}
              fullWidth
            />
            <TextField
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              slotProps={{
                inputLabel: { shrink: true },
                htmlInput: form.startDate ? { min: form.startDate } : {},
              }}
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
        )}

        {step === 2 && (
          <Box>
            {!hasChanges ? (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No changes — the selected countries and languages are already covered for this period.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 100 }}>Status</TableCell>
                      <TableCell sx={{ width: 200 }}>Date Range</TableCell>
                      <TableCell>Countries</TableCell>
                      <TableCell>Languages</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.map((row, i) => {
                      const chip = STATUS_CHIP[row.status];
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <Chip label={chip.label} color={chip.color} size="small" />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {row.startDate} → {row.endDate}
                          </TableCell>
                          <TableCell>
                            <ChipList
                              items={row.countries.map(countryLabel)}
                            />
                          </TableCell>
                          <TableCell>
                            <ChipList
                              items={row.languages.map(languageLabel)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {unchangedCount > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                {unchangedCount} scheduling{unchangedCount !== 1 ? 's' : ''} unchanged
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {step === 1 && (
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={handlePreview}>
            Preview
          </Button>
        )}
        {step === 2 && (
          <>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={handleApply}
              disabled={!hasChanges}
            >
              Apply
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
