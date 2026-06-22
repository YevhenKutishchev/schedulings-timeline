import { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import dayjs from 'dayjs';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { computeChangeEventsV2, type ChangeTypeV2, type CountryDiff } from '../../utils/changelog';

interface Props {
  schedulings: Scheduling[];
}

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

const TYPE_CONFIG: Record<
  ChangeTypeV2,
  { label: string; color: 'success' | 'error' | 'info' | 'warning'; description: string }
> = {
  country_activated: {
    label: 'Activated',
    color: 'success',
    description: 'Country became active for the first time with these languages.',
  },
  languages_added: {
    label: '+ Languages',
    color: 'info',
    description: 'Country was already active and gained these additional languages.',
  },
  languages_removed: {
    label: '− Languages',
    color: 'warning',
    description: 'Country lost these languages but remains active with its remaining languages.',
  },
  country_deactivated: {
    label: 'Deactivated',
    color: 'error',
    description: 'Country became fully inactive (no languages remain).',
  },
};

function CountryDiffChipLabel({
  diff,
  type,
  changedCount,
}: {
  diff: CountryDiff;
  type: ChangeTypeV2;
  changedCount: number;
}) {
  const isGain = type === 'country_activated' || type === 'languages_added';
  const sign = isGain ? '+' : '-';
  const color = isGain ? 'success.main' : 'error.main';
  return (
    <span>
      {countryLabel(diff.country)}{' '}
      <sup>
        <Box component="span" sx={{ color, fontWeight: 700 }}>
          {sign}{changedCount}
        </Box>
        {' '}({diff.langsAfter})
      </sup>
    </span>
  );
}

export function SchedulingChangelogV2({ schedulings }: Props) {
  const [copied, setCopied] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const [showDiffByCountry, setShowDiffByCountry] = useState(true);

  const events = computeChangeEventsV2(schedulings);

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(events, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (schedulings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No schedulings yet. Click "New Scheduling" to create one.
      </Typography>
    );
  }

  if (events.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No changes found.
      </Typography>
    );
  }

  return (
    <Box>
      {/* Legend / description */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', mb: 0.5, gap: 1 }}>
          <Button
            size="small"
            startIcon={<InfoOutlinedIcon />}
            onClick={() => setLegendOpen((v) => !v)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            {legendOpen ? 'Hide legend' : 'Show legend'}
          </Button>
        </Stack>
        <Collapse in={legendOpen}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Each row describes what changed on a given date for a group of countries
              that all experienced the same change. Four change types are possible:
            </Typography>
            <Stack spacing={1}>
              {(Object.entries(TYPE_CONFIG) as [ChangeTypeV2, typeof TYPE_CONFIG[ChangeTypeV2]][]).map(
                ([, cfg]) => (
                  <Stack key={cfg.label} direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                    <Chip label={cfg.label} color={cfg.color} size="small" sx={{ minWidth: 110 }} />
                    <Typography variant="caption" color="text.secondary">
                      {cfg.description}
                    </Typography>
                  </Stack>
                ),
              )}
            </Stack>
          </Paper>
        </Collapse>
      </Box>

      {/* Toolbar */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={showDiffByCountry}
              onChange={(e) => setShowDiffByCountry(e.target.checked)}
              size="small"
            />
          }
          label="Show diff by country"
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
          color={copied ? 'success' : 'inherit'}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy changes JSON'}
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 150 }}>Date</TableCell>
              <TableCell sx={{ width: 140 }}>Change type</TableCell>
              <TableCell>Countries</TableCell>
              <TableCell>Languages</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) =>
              event.rows.map((row, rowIndex) => {
                const cfg = TYPE_CONFIG[row.type];
                return (
                  <TableRow
                    key={`${event.date}-${rowIndex}`}
                    sx={{
                      ...(rowIndex === 0 && {
                        '& td': { borderTop: 2, borderTopColor: 'divider' },
                      }),
                    }}
                  >
                    <TableCell sx={{ verticalAlign: 'top', pt: 1 }}>
                      {rowIndex === 0 && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {dayjs(event.date).format('MMM D, YYYY')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 1 }}>
                      <Chip label={cfg.label} color={cfg.color} size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {showDiffByCountry
                          ? row.countryDiffs.map((diff) => (
                              <Tooltip
                                key={diff.country}
                                title={`Before: ${diff.langsBefore} lang${diff.langsBefore !== 1 ? 's' : ''} → After: ${diff.langsAfter} lang${diff.langsAfter !== 1 ? 's' : ''}`}
                              >
                                <Chip
                                  label={
                                    <CountryDiffChipLabel
                                      diff={diff}
                                      type={row.type}
                                      changedCount={row.languages.length}
                                    />
                                  }
                                  size="small"
                                  variant="outlined"
                                />
                              </Tooltip>
                            ))
                          : row.countries.map((c) => (
                              <Chip key={c} label={countryLabel(c)} size="small" variant="outlined" />
                            ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {row.languages.map((l) => (
                          <Chip
                            key={l}
                            label={languageLabel(l)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
