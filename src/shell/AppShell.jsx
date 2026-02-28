import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddRoadIcon from '@mui/icons-material/AddRoad';
import SearchIcon from '@mui/icons-material/Search';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LockResetIcon from '@mui/icons-material/LockReset';
import ArchiveIcon from '@mui/icons-material/Archive';

const drawerWidth = 248;

export default function AppShell({ onLogout, mode, onToggleMode, onChangePassword }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordMsgType, setPasswordMsgType] = useState('error');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const location = useLocation();

  const title = useMemo(() => {
    if (location.pathname.includes('/rides/new')) return 'New Ride';
    if (location.pathname.includes('/rides/search')) return 'Search Rides';
    if (location.pathname.includes('/backups')) return 'Backups';
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
      <Box sx={{ p: 1.25, pt: 1.5 }}>
        <Box
          component="img"
          src="/versa-logo.png"
          alt="Versa Tours"
          sx={{
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
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

        <ListItemButton
          component={NavLink}
          to="/backups"
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
            <ArchiveIcon />
          </ListItemIcon>
          <ListItemText primary="Backups" />
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

  function openChangePassword() {
    setPasswordMsg('');
    setPasswordMsgType('error');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordOpen(true);
  }

  function closeChangePassword() {
    if (isChangingPassword) return;
    setPasswordOpen(false);
  }

  async function submitChangePassword() {
    setPasswordMsg('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsgType('error');
      setPasswordMsg('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMsgType('error');
      setPasswordMsg('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsgType('error');
      setPasswordMsg('New password and confirmation do not match.');
      return;
    }

    if (typeof onChangePassword !== 'function') {
      setPasswordMsgType('error');
      setPasswordMsg('Change password is not available.');
      return;
    }

    try {
      setIsChangingPassword(true);
      const result = await onChangePassword(currentPassword, newPassword);
      if (!result?.ok) {
        setPasswordMsgType('error');
        setPasswordMsg(result?.error || 'Could not change password.');
        return;
      }

      setPasswordMsgType('success');
      setPasswordMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsChangingPassword(false);
    }
  }

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

          <Button
            color="inherit"
            size="small"
            variant="outlined"
            startIcon={<LockResetIcon />}
            onClick={openChangePassword}
            sx={{
              borderColor: 'divider',
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          >
            Change Password
          </Button>

          <IconButton
            color="inherit"
            onClick={openChangePassword}
            aria-label="Change password"
            title="Change password"
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <LockResetIcon />
          </IconButton>

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

      <Dialog open={passwordOpen} onClose={closeChangePassword} fullWidth maxWidth="xs">
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.25, pt: 1 }}>
          {passwordMsg ? <Alert severity={passwordMsgType}>{passwordMsg}</Alert> : null}
          <TextField
            label="Current Password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isChangingPassword}
          />
          <TextField
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isChangingPassword}
            helperText="At least 8 characters"
          />
          <TextField
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isChangingPassword}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeChangePassword} disabled={isChangingPassword}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitChangePassword} disabled={isChangingPassword}>
            {isChangingPassword ? 'Saving...' : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
