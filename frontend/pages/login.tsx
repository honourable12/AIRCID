'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  CssBaseline,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Login as LoginIcon,
  Person as PersonIcon,
  Science as ScienceIcon
} from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

const theme = createTheme();

const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(username.trim());
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleDemoLogin = (demoUsername: string) => {
    setUsername(demoUsername);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}
          >
            {/* Logo/Brand */}
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <ScienceIcon />
            </Avatar>
            
            <Typography component="h1" variant="h4" gutterBottom color="primary">
              AIRCID
            </Typography>
            
            <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 3 }}>
              AI Research Case Identification & Data Integration Tool
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={!username.trim() || isLoading}
                startIcon={<LoginIcon />}
                size="large"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Demo Accounts
                </Typography>
              </Divider>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDemoLogin('dr.smith')}
                  disabled={isLoading}
                >
                  Demo: Dr. Smith (Principal Investigator)
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDemoLogin('j.doe')}
                  disabled={isLoading}
                >
                  Demo: J. Doe (Research Coordinator)
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDemoLogin('researcher')}
                  disabled={isLoading}
                >
                  Demo: Generic Researcher
                </Button>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              This is a demo application with simulated authentication.
              <br />
              Enter any username to generate a demo session.
            </Typography>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default LoginPage;