import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Divider
} from '@mui/material';
import { Info } from '@mui/icons-material';

const DevelopmentLoginInfo: React.FC = () => {
  // Only show in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  const credentials = [
    {
      email: 'admin@example.com',
      password: 'admin123',
      role: 'Admin',
      color: 'error' as const,
    },
    {
      email: 'doctor@example.com', 
      password: 'doctor123',
      role: 'Doctor',
      color: 'primary' as const,
    },
    {
      email: 'coordinator@example.com',
      password: 'coordinator123', 
      role: 'Coordinator',
      color: 'secondary' as const,
    },
  ];

  return (
    <Card 
      sx={{ 
        mb: 3, 
        border: '1px dashed #orange',
        backgroundColor: '#fff3e0'
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Info color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6" color="warning.dark">
            Development Mode - Test Credentials
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" mb={2}>
          Use any of these credentials to log in:
        </Typography>
        
        {credentials.map((cred, index) => (
          <Box key={index} mb={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Chip 
                label={cred.role} 
                color={cred.color} 
                size="small" 
              />
              <Typography variant="body2" fontWeight="bold">
                {cred.email}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" ml={2}>
              Password: <code>{cred.password}</code>
            </Typography>
            {index < credentials.length - 1 && <Divider sx={{ mt: 1 }} />}
          </Box>
        ))}
        
        <Box mt={2} p={1} bgcolor="warning.light" borderRadius={1}>
          <Typography variant="caption" color="warning.dark">
            💡 This panel only appears in development mode. API calls are mocked locally.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DevelopmentLoginInfo;
