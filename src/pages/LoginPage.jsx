import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onLogin(email, password);
      if (!result?.ok) {
        setError(result?.error || 'Login failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'linear-gradient(130deg, rgba(252,180,76,0.22) 0%, rgba(252,204,116,0.2) 40%, rgba(255,250,242,1) 100%)',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 22px 60px rgba(18, 38, 58, 0.16)',
        }}
      >
        <CardContent sx={{ p: 3.5 }}>
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800 }}>
            Versa Tours
          </Typography>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Admin Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to manage rides and reports.
          </Typography>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              Sign In
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
