import { useState } from 'react';
import {
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Divider,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CheckIcon from '@mui/icons-material/Check';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TimelineIcon from '@mui/icons-material/Timeline';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import { useSchedulings } from '../context/SchedulingsContext';
import { SchedulingForm } from '../components/SchedulingForm/SchedulingForm';
import { SchedulingTable } from '../components/SchedulingTable/SchedulingTable';
import { SchedulingTimeline } from '../components/SchedulingTimeline/SchedulingTimeline';
import { SchedulingNonLinearTimeline } from '../components/SchedulingNonLinearTimeline/SchedulingNonLinearTimeline';
import { AddToTimelineDialog } from '../components/AddToTimeline/AddToTimelineDialog';
import { DEMO_SETS } from '../data/demoSchedulings';
import type { Scheduling, SchedulingDraft } from '../types/scheduling';

type ViewMode = 'table' | 'timeline' | 'nonlinear';

export function SchedulingsPage() {
  const { schedulings, add, update, remove, reset } = useSchedulings();
  const [view, setView] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Scheduling | undefined>();
  const [demoAnchor, setDemoAnchor] = useState<HTMLElement | null>(null);
  const [activeDemoName, setActiveDemoName] = useState<string | null>(null);
  const [addToTimelineOpen, setAddToTimelineOpen] = useState(false);

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
    setActiveDemoName(set.name);
    setDemoAnchor(null);
  }

  return (
    <>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Schedulings
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            size="small"
            onChange={(_, v) => v && setView(v)}
          >
            <ToggleButton value="table">
              <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} />
              Table
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

          <Divider orientation="vertical" flexItem />
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddToTimelineOpen(true)}
            disabled={schedulings.length === 0}
          >
            Add Expansion
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            New Scheduling
          </Button>
        </Stack>
      </Stack>

      {view === 'table' && (
        <SchedulingTable schedulings={schedulings} onEdit={handleEdit} onDelete={remove} />
      )}
      {view === 'timeline' && (
        <SchedulingTimeline schedulings={schedulings} onEdit={handleEdit} onDelete={remove} />
      )}
      {view === 'nonlinear' && (
        <SchedulingNonLinearTimeline schedulings={schedulings} onEdit={handleEdit} onDelete={remove} />
      )}

      <SchedulingForm
        open={formOpen}
        initial={editing}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />

      <AddToTimelineDialog
        open={addToTimelineOpen}
        schedulings={schedulings}
        onClose={() => setAddToTimelineOpen(false)}
        onApply={(result) => {
          reset(result);
          setAddToTimelineOpen(false);
        }}
      />
    </>
  );
}
