import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { SchedulingsProvider } from './context/SchedulingsContext';
import { AppLayout } from './components/AppLayout/AppLayout';
import { SchedulingsPage } from './pages/SchedulingsPage';

const theme = createTheme({
  colorSchemes: { dark: true },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SchedulingsProvider>
        <AppLayout>
          <SchedulingsPage />
        </AppLayout>
      </SchedulingsProvider>
    </ThemeProvider>
  );
}
