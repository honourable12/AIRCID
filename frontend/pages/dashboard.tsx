'use client';
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Fab,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
  Assignment as StudyIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ProtectedRoute from '../components/ProtectedRoute';
import GenAIChatSidebar from '../components/GenAIChatSidebar';
import StatChart, { createEnrollmentData, createStatusPieData, createTimelineData } from '../components/StatChart';
import CriteriaRefiner from '../components/CriteriaRefiner';
import DocumentUpload from '../components/DocumentUpload';
import TextSummarizer from '../components/TextSummarizer';
import type { Study } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toggleChat, isOpen: isChatOpen } = useChat();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [studies, setStudies] = useState<Study[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockStudies: Study[] = [
      {
        id: 'study_001',
        title: 'Phase II Trial of Drug X in Rheumatoid Arthritis',
        objective: 'Evaluate efficacy and safety of Drug X in moderate to severe RA patients',
        status: 'active',
        created_date: '2024-01-15',
        enrollment_target: 120,
        enrollment_current: 87,
        last_updated: '2024-12-19'
      },
      {
        id: 'study_002',
        title: 'Biomarker Discovery Study - Lung Cancer',
        objective: 'Identify novel biomarkers for early lung cancer detection',
        status: 'active',
        created_date: '2024-02-01',
        enrollment_target: 200,
        enrollment_current: 156,
        last_updated: '2024-12-18'
      },
      {
        id: 'study_003',
        title: 'Digital Health Intervention - Diabetes',
        objective: 'Assess mobile app effectiveness in diabetes management',
        status: 'completed',
        created_date: '2023-11-10',
        enrollment_target: 80,
        enrollment_current: 80,
        last_updated: '2024-12-10'
      },
      {
        id: 'study_004',
        title: 'Cardiac Safety Study - New Antiarrhythmic',
        objective: 'Evaluate cardiac safety profile of new antiarrhythmic agent',
        status: 'draft',
        created_date: '2024-12-01',
        enrollment_target: 150,
        enrollment_current: 0,
        last_updated: '2024-12-19'
      }
    ];
    setStudies(mockStudies);
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getStatusColor = (status: Study['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'primary';
      case 'draft':
        return 'warning';
      default:
        return 'default';
    }
  };

  const totalEnrollment = studies.reduce((sum, study) => sum + study.enrollment_current, 0);
  const averageProgress = studies.length > 0 
    ? (studies.reduce((sum, study) => sum + (study.enrollment_current / study.enrollment_target), 0) / studies.length * 100)
    : 0;

  return (
    <ProtectedRoute>
      <Box sx={{ flexGrow: 1 }}>
        {/* App Bar */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AIRCID Dashboard
            </Typography>
            
            <IconButton color="inherit" onClick={toggleChat}>
              <ChatIcon />
            </IconButton>
            
            <IconButton 
              color="inherit"
              onClick={handleMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                <PersonIcon />
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2">
                  {user?.name || user?.username}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 2 }} />
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Welcome Section */}
          <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}>
            <Typography variant="h4" color="white" gutterBottom>
              Welcome back, {user?.name || user?.username}!
            </Typography>
            <Typography variant="body1" color="white" sx={{ opacity: 0.9 }}>
              Managing {studies.length} clinical studies with {totalEnrollment} total participants enrolled
            </Typography>
          </Paper>

          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <StudyIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" color="primary">
                        {studies.filter(s => s.status === 'active').length}
                      </Typography>
                      <Typography color="text.secondary">Active Studies</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TrendingIcon color="secondary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" color="secondary">
                        {totalEnrollment}
                      </Typography>
                      <Typography color="text.secondary">Total Enrolled</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <NotificationsIcon color="warning" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="h4" color="warning.main">
                        3
                      </Typography>
                      <Typography color="text.secondary">New Matches Today</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Alerts Section */}
          <Alert severity="info" sx={{ mb: 4 }} icon={<NotificationsIcon />}>
            <Typography variant="subtitle2">
              3 new potential matches found for "Phase II Trial of Drug X in Rheumatoid Arthritis"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Based on updated inclusion criteria and patient database screening
            </Typography>
          </Alert>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <StatChart
                type="bar"
                title="Enrollment Progress by Study"
                data={createEnrollmentData(studies)}
                height={300}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatChart
                type="pie"
                title="Study Status Distribution"
                data={createStatusPieData(studies)}
                height={300}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <StatChart
                type="line"
                title="Monthly Enrollment Trend"
                data={createTimelineData(studies)}
                height={250}
              />
            </Grid>
          </Grid>

          {/* Criteria Refiner */}
          <CriteriaRefiner
            placeholder="Enter study inclusion/exclusion criteria to refine with AI assistance..."
            onCriteriaUpdate={(refined) => {
              console.log('Criteria refined:', refined);
            }}
          />

          {/* Document Upload */}
          <DocumentUpload
            onDocumentUploaded={(doc) => {
              console.log('Document uploaded:', doc);
            }}
          />

          {/* Text Summarizer */}
          <TextSummarizer
            context="clinical study dashboard summary"
            onSummaryGenerated={(summary) => {
              console.log('Summary generated:', summary);
            }}
          />

          {/* Studies List */}
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            Your Studies
          </Typography>

          <Grid container spacing={3}>
            {studies.map((study) => (
              <Grid item xs={12} md={6} key={study.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        {study.title}
                      </Typography>
                      <Chip
                        label={study.status.toUpperCase()}
                        color={getStatusColor(study.status)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {study.objective}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Enrollment: {study.enrollment_current} / {study.enrollment_target} 
                        ({Math.round((study.enrollment_current / study.enrollment_target) * 100)}%)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {new Date(study.last_updated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => router.push(`/study/${study.id}`)}
                    >
                      View Details
                    </Button>
                    <Button size="small" color="primary">
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Add Study Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => router.push('/study/new')}
            >
              Create New Study
            </Button>
          </Box>
        </Container>

        {/* Floating Chat Button (when chat is closed) */}
        {!isChatOpen && (
          <Fab
            color="primary"
            aria-label="chat"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            onClick={toggleChat}
          >
            <ChatIcon />
          </Fab>
        )}

        {/* Chat Sidebar */}
        <GenAIChatSidebar />
      </Box>
    </ProtectedRoute>
  );
};

export default Dashboard;