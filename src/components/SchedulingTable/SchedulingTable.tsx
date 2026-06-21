import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Stack,
  Typography,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { filterItems } from '../../utils/filters';

interface Props {
  schedulings: Scheduling[];
  filterCountries?: string[];
  filterLanguages?: string[];
  onEdit: (s: Scheduling) => void;
  onDelete: (id: string) => void;
}

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

export function SchedulingTable({
  schedulings,
  filterCountries = [],
  filterLanguages = [],
  onEdit,
  onDelete,
}: Props) {
  if (schedulings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No schedulings yet. Click "New Scheduling" to create one.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Countries</TableCell>
            <TableCell>Languages</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {schedulings.map((s) => {
            const { visible: visibleCountries, hiddenCount: hiddenCountries } =
              filterItems(s.countries, filterCountries);
            const { visible: visibleLanguages, hiddenCount: hiddenLanguages } =
              filterItems(s.languages, filterLanguages);

            return (
              <TableRow key={s.id} hover>
                <TableCell>{s.startDate}</TableCell>
                <TableCell>{s.endDate}</TableCell>
                <TableCell>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {visibleCountries.map((code) => (
                      <Chip key={code} label={countryLabel(code)} size="small" variant="outlined" />
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
                </TableCell>
                <TableCell>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {visibleLanguages.map((tag) => (
                      <Chip
                        key={tag}
                        label={languageLabel(tag)}
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
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => onEdit(s)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => onDelete(s.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
