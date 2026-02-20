import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import SearchIcon from '@mui/icons-material/Search';
import LocalTaxiIcon from '@mui/icons-material/LocalTaxi';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const drawerWidth = 248;

export default function AppShell({ onLogout, mode, onToggleMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const title = useMemo(() => {
    if (location.pathname.includes('/rides/new')) return 'New Ride';
    if (location.pathname.includes('/rides/search')) return 'Search Rides';
    return 'Taxi Admin';
  }, [location.pathname]);

  const nav = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #fccc74 0%, #fcb44c 100%)',
        color: '#32251c',
      }}
    >
      <Box sx={{ p: 2.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: '#32251c', color: '#fccc74', width: 36, height: 36 }}>
          <LocalTaxiIcon fontSize="small" />
        </Avatar>
        <Typography variant="h6" fontWeight={800}>
          Transit Ops
        </Typography>
      </Box>

      <Box sx={{ px: 2.25, pb: 2 }}>
        <Chip
          label="Admin Console"
          size="small"
          sx={{
            color: '#32251c',
            bgcolor: 'rgba(50,37,28,0.12)',
            fontWeight: 700,
          }}
        />
      </Box>

      <Divider sx={{ borderColor: 'rgba(50,37,28,0.25)' }} />

      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          component={NavLink}
          to="/rides/new"
          onClick={() => setMobileOpen(false)}
          sx={{
            borderRadius: 0.5,
            mb: 0.5,
            color: '#32251c',
            '& .MuiListItemIcon-root': { color: '#32251c' },
            '&.active': {
              bgcolor: 'rgba(50,37,28,0.16)',
              color: '#22180f',
              '& .MuiListItemIcon-root': { color: '#22180f' },
            },
          }}
        >
          <ListItemIcon>
            <AddRoadIcon />
          </ListItemIcon>
          <ListItemText primary="New Ride" />
        </ListItemButton>

        <ListItemButton
          component={NavLink}
          to="/rides/search"
          onClick={() => setMobileOpen(false)}
          sx={{
            borderRadius: 0.5,
            color: '#32251c',
            '& .MuiListItemIcon-root': { color: '#32251c' },
            '&.active': {
              bgcolor: 'rgba(50,37,28,0.16)',
              color: '#22180f',
              '& .MuiListItemIcon-root': { color: '#22180f' },
            },
          }}
        >
          <ListItemIcon>
            <SearchIcon />
          </ListItemIcon>
          <ListItemText primary="Search / Reports" />
        </ListItemButton>
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{ boxShadow: 'none' }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: (t) =>
            t.palette.mode === 'dark' ? 'rgba(18,24,33,0.9)' : 'rgba(255,255,255,0.9)',
          color: (t) => (t.palette.mode === 'dark' ? t.palette.text.primary : '#32251c'),
          backdropFilter: 'blur(6px)',
          borderRadius: 0,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((v) => !v)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" fontWeight={700} noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          <IconButton
            color="inherit"
            onClick={onToggleMode}
            aria-label="Toggle light and dark mode"
            title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          <Chip
            size="small"
            label="Live"
            color="primary"
            sx={{ fontWeight: 700, display: { xs: 'none', sm: 'inline-flex' } }}
          />
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: 'min(88vw, 300px)', borderRadius: 0 },
          }}
        >
          {nav}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRadius: 0 },
          }}
          open
        >
          {nav}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2.5 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
