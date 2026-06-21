import { Box, Button, Stack, Typography } from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { MultiAutocomplete } from '../SchedulingForm/MultiAutocomplete';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';

interface Props {
  availableCountries: string[];
  availableLanguages: string[];
  filterCountries: string[];
  filterLanguages: string[];
  onCountriesChange: (ids: string[]) => void;
  onLanguagesChange: (ids: string[]) => void;
}

export function SchedulingFilters({
  availableCountries,
  availableLanguages,
  filterCountries,
  filterLanguages,
  onCountriesChange,
  onLanguagesChange,
}: Props) {
  const countryOptions = availableCountries.map((code) => {
    const label = COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();
    return { id: code, label: `${code.toUpperCase()} – ${label}` };
  });

  const languageOptions = availableLanguages.map((tag) => {
    const label = LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;
    return { id: tag, label: `${tag} – ${label}` };
  });

  const hasActiveFilter = filterCountries.length > 0 || filterLanguages.length > 0;

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mt: 1, flexShrink: 0, lineHeight: '40px' }}
      >
        Filter:
      </Typography>
      <Stack direction="row" spacing={2} sx={{ flex: 1, alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: '250px' }}>
          <MultiAutocomplete
            options={countryOptions}
            value={filterCountries}
            onChange={onCountriesChange}
            label={`Countries${filterCountries.length > 0 ? ` (${filterCountries.length})` : ''}`}
          />
        </Box>
        <Box sx={{ minWidth: '250px' }}>
          <MultiAutocomplete
            options={languageOptions}
            value={filterLanguages}
            onChange={onLanguagesChange}
            label={`Languages${filterLanguages.length > 0 ? ` (${filterLanguages.length})` : ''}`}
          />
        </Box>
      </Stack>
      {hasActiveFilter && (
        <Button
          size="small"
          startIcon={<FilterListOffIcon />}
          onClick={() => {
            onCountriesChange([]);
            onLanguagesChange([]);
          }}
          sx={{ mt: 0.5, flexShrink: 0 }}
        >
          Clear
        </Button>
      )}
    </Stack>
  );
}
