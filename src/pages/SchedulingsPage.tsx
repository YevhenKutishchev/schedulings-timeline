import { useState } from 'react';
import {
  Button,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PlaylistRemoveIcon from '@mui/icons-material/PlaylistRemove';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import ChangeHistoryIcon from '@mui/icons-material/ChangeHistory';
import { useSchedulings } from '../context/SchedulingsContext';
import { SchedulingForm } from '../components/SchedulingForm/SchedulingForm';
import { SchedulingTable } from '../components/SchedulingTable/SchedulingTable';
import { SchedulingTimeline } from '../components/SchedulingTimeline/SchedulingTimeline';
import { SchedulingNonLinearTimeline } from '../components/SchedulingNonLinearTimeline/SchedulingNonLinearTimeline';
import { SchedulingChangelog } from '../components/SchedulingChangelog/SchedulingChangelog';
import { TimelineOperationDialog, type TimelineOperationMode } from '../components/TimelineOperation/TimelineOperationDialog';
import { SchedulingFilters } from '../components/SchedulingFilters/SchedulingFilters';
import { DEMO_SETS } from '../data/demoSchedulings';
import { applyFilters } from '../utils/filters';
import type { Scheduling, SchedulingDraft } from '../types/scheduling';

type ViewMode = 'table' | 'timeline' | 'nonlinear' | 'changelog';

export function SchedulingsPage() {
  const { schedulings, add, update, remove, reset } = useSchedulings();
  const [view, setView] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Scheduling | undefined>();
  const [demoAnchor, setDemoAnchor] = useState<HTMLElement | null>(null);
  const [activeDemoName, setActiveDemoName] = useState<string | null>(null);
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);
  const [timelineOpMode, setTimelineOpMode] = useState<TimelineOperationMode>('add');
  const [timelineOpOpen, setTimelineOpOpen] = useState(false);
  const [filterCountries, setFilterCountries] = useState<string[]>([]);
  const [filterLanguages, setFilterLanguages] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);

  function handleCopyJson() {
    navigator.clipboard.writeText(JSON.stringify(schedulings, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(draft: SchedulingDraft) {
    if (editing) {
      update(editing.id, draft);
    } else {
      add(draft);
    }
    setFormOpen(false);
    setEditing(undefined);
  }

  function handleEdit(s: Scheduling) {
    setEditing(s);
    setFormOpen(true);
  }

  function handleClose() {
    setFormOpen(false);
    setEditing(undefined);
  }

  function handleDemoSelect(index: number) {
    const set = DEMO_SETS[index];
    reset(set.schedulings);
    setFilterCountries([]);
    setFilterLanguages([]);
    setActiveDemoName(set.name);
    setDemoAnchor(null);
  }

  function openTimelineOp(mode: TimelineOperationMode) {
    setTimelineOpMode(mode);
    setEditAnchor(null);
    setTimelineOpOpen(true);
  }

  const availableCountries = [...new Set(schedulings.flatMap((s) => s.countries))].sort();
  const availableLanguages = [...new Set(schedulings.flatMap((s) => s.languages))].sort();
  const filteredSchedulings = applyFilters(schedulings, filterCountries, filterLanguages);

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {/* Row 1: title + view toggle */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Schedulings
          </Typography>
          <ToggleButtonGroup
            value={view}
            exclusive
            size="small"
            onChange={(_, v) => v && setView(v)}
          >
            <ToggleButton value="table">
              <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} />
              Schedulings
            </ToggleButton>
            <ToggleButton value="changelog">
              <ChangeHistoryIcon fontSize="small" sx={{ mr: 0.5 }} />
              Changes
            </ToggleButton>
            <ToggleButton value="timeline">
              <TimelineIcon fontSize="small" sx={{ mr: 0.5 }} />
              Timeline
            </ToggleButton>
            <ToggleButton value="nonlinear">
              <ScatterPlotIcon fontSize="small" sx={{ mr: 0.5 }} />
              Non-linear
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Row 2: data actions + ··· dev tools */}
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoAwesomeIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setDemoAnchor(e.currentTarget)}
          >
            {activeDemoName ?? 'Demo data'}
          </Button>
          <Menu
            anchorEl={demoAnchor}
            open={Boolean(demoAnchor)}
            onClose={() => setDemoAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            {DEMO_SETS.map((set, i) => {
              const isActive = set.name === activeDemoName;
              return (
                <MenuItem key={set.name} onClick={() => handleDemoSelect(i)} selected={isActive}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {isActive && <CheckIcon fontSize="small" color="primary" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={set.name}
                    secondary={`${set.schedulings.length} schedulings`}
                  />
                </MenuItem>
              );
            })}
          </Menu>

          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setEditAnchor(e.currentTarget)}
            disabled={schedulings.length === 0}
          >
            Edit Timeline
          </Button>
          <Menu
            anchorEl={editAnchor}
            open={Boolean(editAnchor)}
            onClose={() => setEditAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <MenuItem onClick={() => openTimelineOp('add')}>
              <ListItemIcon>
                <PlaylistAddIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText primary="Add to Timeline" />
            </MenuItem>
            <MenuItem onClick={() => openTimelineOp('remove')}>
              <ListItemIcon>
                <PlaylistRemoveIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Remove from Timeline" />
            </MenuItem>
          </Menu>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            New Scheduling
          </Button>

          <Tooltip title="Developer tools">
            <IconButton size="small" onClick={(e) => setMoreAnchor(e.currentTarget)}>
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={moreAnchor}
            open={Boolean(moreAnchor)}
            onClose={() => setMoreAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => { handleCopyJson(); setMoreAnchor(null); }}
              disabled={schedulings.length === 0}
            >
              <ListItemIcon>
                {copied ? <CheckCircleIcon fontSize="small" color="success" /> : <ContentCopyIcon fontSize="small" />}
              </ListItemIcon>
              <ListItemText primary={copied ? 'Copied!' : 'Copy Schedulings JSON'} />
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {schedulings.length > 0 && view !== 'changelog' && (
        <SchedulingFilters
          availableCountries={availableCountries}
          availableLanguages={availableLanguages}
          filterCountries={filterCountries}
          filterLanguages={filterLanguages}
          onCountriesChange={setFilterCountries}
          onLanguagesChange={setFilterLanguages}
        />
      )}

      {view === 'table' && (
        <SchedulingTable
          schedulings={filteredSchedulings}
          filterCountries={filterCountries}
          filterLanguages={filterLanguages}
          onEdit={handleEdit}
          onDelete={remove}
        />
      )}
      {view === 'timeline' && (
        <SchedulingTimeline
          schedulings={filteredSchedulings}
          filterCountries={filterCountries}
          filterLanguages={filterLanguages}
          onEdit={handleEdit}
          onDelete={remove}
        />
      )}
      {view === 'nonlinear' && (
        <SchedulingNonLinearTimeline
          schedulings={filteredSchedulings}
          filterCountries={filterCountries}
          filterLanguages={filterLanguages}
          onEdit={handleEdit}
          onDelete={remove}
        />
      )}
      {view === 'changelog' && (
        <SchedulingChangelog schedulings={schedulings} />
      )}

      <SchedulingForm
        open={formOpen}
        initial={editing}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />

      <TimelineOperationDialog
        mode={timelineOpMode}
        open={timelineOpOpen}
        schedulings={schedulings}
        onClose={() => setTimelineOpOpen(false)}
        onApply={(result) => {
          reset(result);
          setTimelineOpOpen(false);
        }}
      />
    </>
  );
}
