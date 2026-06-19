import { useState } from 'react';
import { Button, Stack, ToggleButton, ToggleButtonGroup, Typography, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useSchedulings } from '../context/SchedulingsContext';
import { SchedulingForm } from '../components/SchedulingForm/SchedulingForm';
import { SchedulingTable } from '../components/SchedulingTable/SchedulingTable';
import { SchedulingTimeline } from '../components/SchedulingTimeline/SchedulingTimeline';
import { DEMO_SCHEDULINGS } from '../data/demoSchedulings';
import type { Scheduling, SchedulingDraft } from '../types/scheduling';

type ViewMode = 'table' | 'timeline';

export function SchedulingsPage() {
  const { schedulings, add, update, remove, reset } = useSchedulings();
  const [view, setView] = useState<ViewMode>('table');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Scheduling | undefined>();

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
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => reset(DEMO_SCHEDULINGS)}
          >
            Demo data
          </Button>
          <Divider orientation="vertical" flexItem />
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

      <SchedulingForm
        open={formOpen}
        initial={editing}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    </>
  );
}
