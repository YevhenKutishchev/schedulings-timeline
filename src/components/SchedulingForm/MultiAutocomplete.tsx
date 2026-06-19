import { Autocomplete, TextField, Box } from '@mui/material';

const SELECT_ALL_ID = '__select_all__';

export interface SelectOption {
  id: string;
  label: string;
}

interface Props {
  options: SelectOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  label: string;
  error?: boolean;
  helperText?: string;
}

export function MultiAutocomplete({ options, value, onChange, label, error, helperText }: Props) {
  const allSelected = value.length === options.length && options.length > 0;
  const selectedOptions = options.filter((o) => value.includes(o.id));

  const selectAllOption: SelectOption = {
    id: SELECT_ALL_ID,
    label: allSelected ? 'Clear all' : 'Select all',
  };

  const extendedOptions = [selectAllOption, ...options];

  function handleChange(_: unknown, newValue: SelectOption[]) {
    if (newValue.some((v) => v.id === SELECT_ALL_ID)) {
      onChange(allSelected ? [] : options.map((o) => o.id));
    } else {
      onChange(newValue.map((v) => v.id));
    }
  }

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={extendedOptions}
      getOptionLabel={(o) => o.label}
      value={selectedOptions}
      onChange={handleChange}
      slotProps={{ chip: { size: 'small' } }}
      renderOption={(props, option) => {
        const { key, ...rest } = props;
        if (option.id === SELECT_ALL_ID) {
          return (
            <Box
              key={key}
              component="li"
              {...rest}
              sx={{
                fontStyle: 'italic',
                borderBottom: 1,
                borderColor: 'divider',
                color: 'primary.main',
              }}
            >
              {option.label}
            </Box>
          );
        }
        return (
          <Box key={key} component="li" {...rest}>
            {option.label}
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={value.length > 0 ? `${label} (${value.length})` : label}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
