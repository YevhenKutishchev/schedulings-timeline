import { useState } from 'react';
import {
  Box,
  Button,
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dayjs from 'dayjs';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { computeChangeEvents } from '../../utils/changelog';

interface Props {
  schedulings: Scheduling[];
}

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

export function SchedulingChangelog({ schedulings }: Props) {
  const [countOnly, setCountOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  const events = computeChangeEvents(schedulings);

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
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
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
              <TableCell sx={{ width: 110 }}>Change</TableCell>
              <TableCell>Countries</TableCell>
              <TableCell>Languages</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) =>
              event.rows.map((row, rowIndex) => {
                const sign = row.type === 'added' ? '+' : '-';
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
                          {sign}{row.countries.length}
                        </Typography>
                      ) : (
                        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {row.countries.map((c) => (
                            <Chip key={c} label={countryLabel(c)} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      {countOnly ? (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: row.type === 'added' ? 'success.main' : 'error.main' }}
                        >
                          {sign}{row.languages.length}
                        </Typography>
                      ) : (
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
