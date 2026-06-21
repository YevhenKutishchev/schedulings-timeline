import { useState } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { computeChangeEvents } from '../../utils/changelog';
import { filterItems } from '../../utils/filters';

interface Props {
  schedulings: Scheduling[];
  filterCountries?: string[];
  filterLanguages?: string[];
}

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

export function SchedulingChangelog({
  schedulings,
  filterCountries = [],
  filterLanguages = [],
}: Props) {
  const [countOnly, setCountOnly] = useState(false);

  if (schedulings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No schedulings yet. Click "New Scheduling" to create one.
      </Typography>
    );
  }

  const allEvents = computeChangeEvents(schedulings);

  // When filters are active, keep only rows that involve at least one
  // of the selected countries AND/OR languages.
  const events = allEvents
    .map((event) => ({
      ...event,
      rows: event.rows.filter((row) => {
        const countryMatch =
          filterCountries.length === 0 ||
          row.countries.some((c) => filterCountries.includes(c));
        const languageMatch =
          filterLanguages.length === 0 ||
          row.languages.some((l) => filterLanguages.includes(l));
        return countryMatch && languageMatch;
      }),
    }))
    .filter((event) => event.rows.length > 0);

  if (events.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No changes match the current filters.
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 1.5 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={countOnly}
              onChange={(e) => setCountOnly(e.target.checked)}
              size="small"
            />
          }
          label="Count only"
        />
      </Box>

    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 150 }}>Date</TableCell>
            <TableCell sx={{ width: 110 }}>Change</TableCell>
            <TableCell>Countries</TableCell>
            <TableCell>Languages</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) =>
            event.rows.map((row, rowIndex) => {
              const { visible: visibleCountries, hiddenCount: hiddenCountries } =
                filterItems(row.countries, filterCountries);
              const { visible: visibleLanguages, hiddenCount: hiddenLanguages } =
                filterItems(row.languages, filterLanguages);
              const sign = row.type === 'added' ? '+' : '-';

              return (
                <TableRow
                  key={`${event.date}-${rowIndex}`}
                  sx={{
                    // Draw a top border to separate date groups visually
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
                    <Chip
                      label={row.type === 'added' ? 'Added' : 'Removed'}
                      color={row.type === 'added' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {countOnly ? (
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: row.type === 'added' ? 'success.main' : 'error.main' }}
                      >
                        {sign}{visibleCountries.length}
                        {hiddenCountries > 0 && ` (${hiddenCountries} filtered out)`}
                      </Typography>
                    ) : (
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {visibleCountries.map((c) => (
                          <Chip key={c} label={countryLabel(c)} size="small" variant="outlined" />
                        ))}
                        {hiddenCountries > 0 && (
                          <Chip
                            label={`${hiddenCountries} filtered out`}
                            size="small"
                            variant="outlined"
                            sx={{ color: 'text.disabled', borderColor: 'divider' }}
                          />
                        )}
                      </Stack>
                    )}
                  </TableCell>
                  <TableCell>
                    {countOnly ? (
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: row.type === 'added' ? 'success.main' : 'error.main' }}
                      >
                        {sign}{visibleLanguages.length}
                        {hiddenLanguages > 0 && ` (${hiddenLanguages} filtered out)`}
                      </Typography>
                    ) : (
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {visibleLanguages.map((l) => (
                          <Chip
                            key={l}
                            label={languageLabel(l)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        {hiddenLanguages > 0 && (
                          <Chip
                            label={`${hiddenLanguages} filtered out`}
                            size="small"
                            variant="outlined"
                            sx={{ color: 'text.disabled', borderColor: 'divider' }}
                          />
                        )}
                      </Stack>
                    )}
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
