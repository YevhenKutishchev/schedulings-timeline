import { useState } from 'react';
import { Box, Typography, Chip, Stack, Paper, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import type { Scheduling } from '../../types/scheduling';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES } from '../../data/languages';
import { filterItems } from '../../utils/filters';

const LEFT_PANEL = 220;
const ROW_HEIGHT = 48;
const BAR_HEIGHT = 28;
const HEADER_HEIGHT = 52;
const COL_PX = 120; // pixels per event column

const countryLabel = (code: string) =>
  COUNTRIES.find((c) => c.code === code)?.label ?? code.toUpperCase();

const languageLabel = (tag: string) =>
  LANGUAGES.find((l) => l.tag === tag)?.label ?? tag;

interface Props {
  schedulings: Scheduling[];
  filterCountries?: string[];
  filterLanguages?: string[];
  onEdit: (s: Scheduling) => void;
  onDelete: (id: string) => void;
}

export function SchedulingNonLinearTimeline({
  schedulings,
  filterCountries = [],
  filterLanguages = [],
  onEdit,
  onDelete,
}: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (schedulings.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        No schedulings yet. Click "New Scheduling" to create one.
      </Typography>
    );
  }

  // Collect and sort all unique event dates
  const uniqueDates = [
    ...new Set([
      ...schedulings.map((s) => s.startDate),
      ...schedulings.map((s) => s.endDate),
    ]),
  ].sort();

  const total = uniqueDates.length;
  const dateIndex = new Map(uniqueDates.map((d, i) => [d, i]));

  function pct(date: string): number {
    if (total <= 1) return 50;
    return ((dateIndex.get(date)! + 0.5) / total) * 100;
  }

  function formatEventDate(date: string): string {
    const d = dayjs(date);
    // Suppress month/day for far-future sentinel dates (year > 9000)
    if (d.year() > 9000) return d.format('YYYY');
    return d.format('MMM D\nYYYY');
  }

  const trackWidth = Math.max(total * COL_PX, 200);

  const todayStr = dayjs().format('YYYY-MM-DD');
  const todayIsEvent = uniqueDates.includes(todayStr);
  const todayPct = (() => {
    if (todayIsEvent) return pct(todayStr);
    // Interpolate today between surrounding event dates if it falls within range
    const before = [...uniqueDates].reverse().find((d) => d <= todayStr);
    const after = uniqueDates.find((d) => d >= todayStr);
    if (!before || !after || before === after) return null;
    const iB = dateIndex.get(before)!;
    const iA = dateIndex.get(after)!;
    const dBefore = dayjs(before);
    const dAfter = dayjs(after);
    const dToday = dayjs(todayStr);
    const fraction = dToday.diff(dBefore, 'day') / dAfter.diff(dBefore, 'day');
    return ((iB + fraction * (iA - iB)) / (total - 1)) * 100;
  })();

  return (
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>
      <Box sx={{ minWidth: 700 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: 1,
            borderColor: 'divider',
            height: HEADER_HEIGHT,
          }}
        >
          <Box sx={{ width: LEFT_PANEL, flexShrink: 0, borderRight: 1, borderColor: 'divider' }} />
          <Box sx={{ width: trackWidth, flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            {uniqueDates.map((date) => {
              const p = pct(date);
              const lines = formatEventDate(date).split('\n');
              return (
                <Box
                  key={date}
                  sx={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, transform: 'translateX(-50%)' }}
                >
                  {/* Tick line */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      bottom: 0,
                      width: '1px',
                      bgcolor: 'divider',
                    }}
                  />
                  {/* Date label */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lines.map((line, i) => (
                      <Typography
                        key={i}
                        variant="caption"
                        sx={{ display: 'block', color: 'text.secondary', lineHeight: 1.2 }}
                      >
                        {line}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              );
            })}

            {/* Today indicator in header */}
            {todayPct !== null && (
              <Box
                sx={{
                  position: 'absolute',
                  left: `${todayPct}%`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'error.main',
                  opacity: 0.7,
                  zIndex: 1,
                }}
              />
            )}
          </Box>
        </Box>

        {/* Scheduling rows */}
        {schedulings.map((s) => {
          const barLeft = pct(s.startDate);
          // Single-day schedulings (startDate === endDate) map to the same event index,
          // producing a zero-width bar. Visually extend them by one slot so they remain
          // legible. One slot = 1/total of the track width.
          const barRight = s.startDate === s.endDate
            ? ((dateIndex.get(s.startDate)! + 1.5) / total) * 100
            : pct(s.endDate);
          const barWidth = Math.max(barRight - barLeft, 0.5);
          const isHovered = hoveredId === s.id;
          const { visible: visibleCountries, hiddenCount: hiddenCountries } =
            filterItems(s.countries, filterCountries);
          const { visible: visibleLanguages, hiddenCount: hiddenLanguages } =
            filterItems(s.languages, filterLanguages);

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
                    {visibleCountries.slice(0, 3).map((c) => (
                      <Chip key={c} label={c.toUpperCase()} size="small" sx={{ height: 16, fontSize: 10 }} />
                    ))}
                    {visibleCountries.length > 3 && (
                      <Chip label={`+${visibleCountries.length - 3}`} size="small" sx={{ height: 16, fontSize: 10 }} />
                    )}
                    {hiddenCountries > 0 && (
                      <Chip label={`${hiddenCountries} filtered`} size="small" sx={{ height: 16, fontSize: 10, color: 'text.disabled', borderColor: 'divider' }} variant="outlined" />
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
              <Box sx={{ width: trackWidth, flexShrink: 0, position: 'relative' }}>
                {/* Event grid lines */}
                {uniqueDates.map((date) => (
                  <Box
                    key={`grid-${date}`}
                    sx={{
                      position: 'absolute',
                      left: `${pct(date)}%`,
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
                      width: 2,
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
                        Countries: {visibleCountries.map(countryLabel).join(', ')}
                        {hiddenCountries > 0 && ` (${hiddenCountries} filtered out)`}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        Languages: {visibleLanguages.map(languageLabel).join(', ')}
                        {hiddenLanguages > 0 && ` (${hiddenLanguages} filtered out)`}
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
                      bgcolor: 'secondary.main',
                      borderRadius: 1,
                      zIndex: 2,
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Typography variant="caption" sx={{ color: 'secondary.contrastText', fontSize: 10 }} noWrap>
                      {visibleLanguages.join(', ')}
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
