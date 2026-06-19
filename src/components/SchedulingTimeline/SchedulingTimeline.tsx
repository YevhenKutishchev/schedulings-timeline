import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';

const LEFT_PANEL = 220;
const ROW_HEIGHT = 48;
const BAR_HEIGHT = 28;
const HEADER_HEIGHT = 32;

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

interface Props {
  schedulings: Scheduling[];
  onEdit: (s: Scheduling) => void;
  onDelete: (id: string) => void;
}

export function SchedulingTimeline({ schedulings, onEdit, onDelete }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (schedulings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No schedulings yet. Click "New Scheduling" to create one.
      </Typography>
    );
  }

  const allStarts = schedulings.map((s) => s.startDate);
  const allEnds = schedulings.map((s) => s.endDate);
  const minDate = dayjs(allStarts.reduce((a, b) => (a < b ? a : b)));
  const maxDate = dayjs(allEnds.reduce((a, b) => (a > b ? a : b)));

  // Add 5% padding on each side so bars don't touch the edges
  const paddingDays = Math.max(Math.ceil(maxDate.diff(minDate, 'day') * 0.05), 3);
  const rangeStart = minDate.subtract(paddingDays, 'day');
  const rangeEnd = maxDate.add(paddingDays, 'day');
  const totalDays = rangeEnd.diff(rangeStart, 'day') || 1;

  function pct(date: dayjs.Dayjs) {
    return (date.diff(rangeStart, 'day') / totalDays) * 100;
  }

  // Month markers
  const NICE_STEPS = [1, 2, 3, 6, 12, 24, 36, 60, 120, 240, 600, 1200];
  const niceStep = (raw: number) => NICE_STEPS.find((s) => s >= raw) ?? 1200;

  const totalMonths = Math.ceil(rangeEnd.diff(rangeStart, 'month', true));
  const labelStep = niceStep(Math.ceil(totalMonths / 10));
  const gridStep  = niceStep(Math.ceil(totalMonths / 40));
  const labelFmt  = labelStep >= 12 ? 'YYYY' : 'MMM YYYY';

  const allMonths: { label: string; pct: number; isLabel: boolean }[] = [];
  let cursor = rangeStart.startOf('month');
  let monthIndex = 0;
  while (cursor.isBefore(rangeEnd)) {
    const p = pct(cursor.isBefore(rangeStart) ? rangeStart : cursor);
    const isGrid  = monthIndex % gridStep === 0;
    const isLabel = monthIndex % labelStep === 0;
    if (isGrid || isLabel) {
      allMonths.push({ label: cursor.format(labelFmt), pct: p, isLabel });
    }
    cursor = cursor.add(1, 'month');
    monthIndex++;
  }

  const months = allMonths; // grid lines + label flags combined

  // Today marker
  const today = dayjs();
  const todayPct =
    today.isAfter(rangeStart) && today.isBefore(rangeEnd) ? pct(today) : null;

  return (
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
      <Box sx={{ minWidth: 700 }}>
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: 1,
            borderColor: 'divider',
            height: HEADER_HEIGHT,
          }}
        >
          <Box sx={{ width: LEFT_PANEL, flexShrink: 0, borderRight: 1, borderColor: 'divider' }} />
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {months.map((m) => (
              <Box key={`header-${m.pct}`} sx={{ position: 'absolute', left: `${m.pct}%`, top: 0, bottom: 0 }}>
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, width: '1px', bgcolor: 'divider' }} />
                {m.isLabel && (
                  <Typography
                    variant="caption"
                    sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', whiteSpace: 'nowrap', pl: 0.5, color: 'text.secondary' }}
                  >
                    {m.label}
                  </Typography>
                )}
              </Box>
            ))}
            {/* Today line in header */}
            {todayPct !== null && (
              <Box
                sx={{
                  position: 'absolute',
                  left: `${todayPct}%`,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  bgcolor: 'error.main',
                  opacity: 0.7,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Scheduling rows */}
        {schedulings.map((s) => {
          const barLeft = pct(dayjs(s.startDate));
          const barRight = pct(dayjs(s.endDate));
          const barWidth = Math.max(barRight - barLeft, 0.5);
          const isHovered = hoveredId === s.id;

          return (
            <Box
              key={s.id}
              sx={{
                display: 'flex',
                height: ROW_HEIGHT,
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
                bgcolor: isHovered ? 'action.hover' : 'transparent',
              }}
              onMouseEnter={() => setHoveredId(s.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Left panel */}
              <Box
                sx={{
                  width: LEFT_PANEL,
                  flexShrink: 0,
                  borderRight: 1,
                  borderColor: 'divider',
                  px: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
                    {s.startDate} – {s.endDate}
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.25, mt: 0.25 }}>
                    {s.countries.slice(0, 3).map((c) => (
                      <Chip key={c} label={c.toUpperCase()} size="small" sx={{ height: 16, fontSize: 10 }} />
                    ))}
                    {s.countries.length > 3 && (
                      <Chip label={`+${s.countries.length - 3}`} size="small" sx={{ height: 16, fontSize: 10 }} />
                    )}
                  </Stack>
                </Box>
                {isHovered && (
                  <Stack direction="row" sx={{ flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => onEdit(s)} sx={{ p: 0.25 }}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => onDelete(s.id)} sx={{ p: 0.25 }}>
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                )}
              </Box>

              {/* Bar track */}
              <Box sx={{ flex: 1, position: 'relative' }}>
                {/* Month grid lines — every month */}
                {months.map((m) => (
                  <Box
                    key={`row-line-${m.pct}`}
                    sx={{
                      position: 'absolute',
                      left: `${m.pct}%`,
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      bgcolor: 'divider',
                    }}
                  />
                ))}

                {/* Today line */}
                {todayPct !== null && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${todayPct}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      bgcolor: 'error.main',
                      opacity: 0.5,
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Bar */}
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {s.startDate} → {s.endDate}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        Countries: {s.countries.map(countryLabel).join(', ')}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Languages: {s.languages.map(languageLabel).join(', ')}
                      </Typography>
                    </Box>
                  }
                  arrow
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${barLeft}%`,
                      width: `${barWidth}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: BAR_HEIGHT,
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                      zIndex: 2,
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="primary.contrastText"
                      noWrap
                      sx={{ fontSize: 10 }}
                    >
                      {s.languages.map((t) => t).join(', ')}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
