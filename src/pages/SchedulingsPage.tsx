import { useState } from 'react';
import { Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useSchedulings } from '../context/SchedulingsContext';
import { SchedulingForm } from '../components/SchedulingForm/SchedulingForm';
import { SchedulingTable } from '../components/SchedulingTable/SchedulingTable';
import { SchedulingTimeline } from '../components/SchedulingTimeline/SchedulingTimeline';
import type { Scheduling, SchedulingDraft } from '../types/scheduling';

type ViewMode = 'table' | 'timeline';

export function SchedulingsPage() {
  const { schedulings, add, update, remove } = useSchedulings();
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Schedulings
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
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
