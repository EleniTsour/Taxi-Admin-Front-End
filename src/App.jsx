import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import LoginPage from './pages/LoginPage.jsx';
import AppShell from './shell/AppShell.jsx';
import NewRidePage from './pages/NewRidePage.jsx';
import SearchRidesPage from './pages/SearchRidesPage.jsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function ProtectedRoute({ isAuthed, children }) {
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

const THEME_MODE_KEY = 'taxi-admin-theme-mode';

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [mode, setMode] = useState(() => {
    const saved = window.localStorage.getItem(THEME_MODE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (!isMounted) return;
        setIsAuthed(res.ok);
      } catch {
        if (!isMounted) return;
        setIsAuthed(false);
      } finally {
        if (isMounted) setAuthChecked(true);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogin(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: body?.error || `Login failed (${res.status})` };
      }

      setIsAuthed(true);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot reach backend.' };
    }
  }

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setIsAuthed(false);
    }
  }

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: mode === 'dark'
            ? {
                main: '#fccc74',
                light: '#fcb44c',
                dark: '#c5aa92',
              }
            : {
                main: '#fcb44c',
                light: '#fccc74',
                dark: '#c5aa92',
              },
          secondary: mode === 'dark'
            ? { main: '#dbe3ef' }
            : { main: '#32251c' },
          background: mode === 'dark'
            ? {
                default: '#121821',
                paper: '#121821',
              }
            : {
                default: '#f6f8fc',
                paper: '#f2f4f7',
              },
          text: mode === 'dark'
            ? {
                primary: '#f5f7fb',
                secondary: '#b7c3d3',
              }
            : {
                primary: '#1f2933',
                secondary: '#4f5f72',
              },
        },
        shape: { borderRadius: 6 },
        typography: {
          fontFamily: '"Manrope", "Trebuchet MS", "Segoe UI", sans-serif',
          h4: { fontWeight: 800, letterSpacing: '-0.02em' },
          h5: { fontWeight: 800, letterSpacing: '-0.02em' },
          h6: { fontWeight: 800, letterSpacing: '-0.01em' },
          subtitle1: { fontWeight: 700 },
          button: { textTransform: 'none', fontWeight: 700 },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: mode === 'dark'
                ? {
                    background:
                      'radial-gradient(circle at 10% 10%, #1e2a38 0%, #121821 40%, #121821 100%)',
                  }
                : {
                    background:
                      'radial-gradient(circle at 10% 10%, #ffe7be 0%, #f6f8fc 28%, #f6f8fc 100%)',
                  },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 6,
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.background.default : '#ffffff',
                transition: 'box-shadow .2s ease, border-color .2s ease',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? '#6c7f99' : '#c5aa92',
                },
                '&.Mui-focused': {
                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 0 0 3px rgba(252, 180, 76, 0.24)'
                      : '0 0 0 3px rgba(252, 180, 76, 0.2)',
                },
              }),
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: ({ theme }) => ({
                borderRadius: 8,
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.background.default : '#f2f4f7',
                borderColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(163, 181, 204, 0.24)'
                    : 'rgba(172, 156, 136, 0.24)',
              }),
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 6,
                paddingInline: 14,
              },
              contained: {
                boxShadow:
                  mode === 'dark'
                    ? '0 8px 18px rgba(0, 0, 0, 0.45)'
                    : '0 8px 18px rgba(60, 44, 20, 0.24)',
              },
            },
          },
          MuiTableHead: {
            styleOverrides: {
              root: {
                '& .MuiTableCell-root': {
                  backgroundColor: mode === 'dark' ? '#243346' : 'rgba(252, 204, 116, 0.34)',
                  color: mode === 'dark' ? '#ffe2a8' : '#32251c',
                  fontWeight: 800,
                },
              },
            },
          },
        },
      }),
    [mode],
  );

  if (!authChecked) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
          Checking session...
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route
          path="/login"
          element={isAuthed ? <Navigate to="/rides/new" replace /> : <LoginPage onLogin={handleLogin} />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute isAuthed={isAuthed}>
              <AppShell
                mode={mode}
                onToggleMode={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/rides/new" replace />} />
          <Route path="rides/new" element={<NewRidePage />} />
          <Route path="rides/search" element={<SearchRidesPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthed ? '/' : '/login'} replace />} />
      </Routes>
    </ThemeProvider>
  );
}
