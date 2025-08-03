import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Science as ScienceIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StudyStats, Study } from '@/types';
import { DashboardService } from '@/services/dashboardService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [recentStudies, setRecentStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading dashboard data...');

      // Load stats and recent studies in parallel
      const [statsResponse, studiesResponse] = await Promise.all([
        DashboardService.getDashboardStats(),
        DashboardService.getRecentStudies(5),
      ]);

      console.log('Stats response:', statsResponse);
      console.log('Studies response:', studiesResponse);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      } else {
        console.error('Failed to load stats:', statsResponse.message);
        setError(statsResponse.message || 'Failed to load dashboard stats');
      }

      if (studiesResponse && studiesResponse.data) {
        setRecentStudies(studiesResponse.data);
      } else {
        console.error('Failed to load recent studies - no data in response');
        // Don't set error for studies as stats are more important
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactElement;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'completed':
        return 'info';
      case 'paused':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/studies/create')}
          size="large"
        >
          Create New Study
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Studies"
                value={stats?.totalStudies || 0}
                icon={<ScienceIcon />}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Studies"
                value={stats?.activeStudies || 0}
                icon={<TrendingUpIcon />}
                color="#2e7d32"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Enrollment"
                value={stats?.totalEnrollment || 0}
                icon={<PeopleIcon />}
                color="#ed6c02"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg. Enrollment Rate"
                value={`${stats?.averageEnrollmentRate || 0}%`}
                icon={<AssignmentIcon />}
                color="#9c27b0"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Recent Studies */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    Recent Studies
                  </Typography>
                  <Button size="small" onClick={() => navigate('/studies')}>
                    View All
                  </Button>
                </Box>
                {recentStudies.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No studies found. Create your first study to get started.
                  </Typography>
                ) : (
                  <List>
                    {recentStudies.map((study) => (
                      <ListItem
                        key={study.id}
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          '&:hover': { backgroundColor: '#f5f5f5' },
                          cursor: 'pointer',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                        }}
                        onClick={() => navigate(`/studies/${study.id}`)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 1 }}>
                          <Typography variant="subtitle1" component="div">
                            {study.title}
                          </Typography>
                          <Chip
                            label={study.status}
                            color={getStatusColor(study.status) as any}
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {study.description || 'No description provided'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption">
                            Enrollment: {study.enrollmentCount || 0}/{study.targetEnrollment || 'N/A'}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={study.targetEnrollment ? ((study.enrollmentCount || 0) / study.targetEnrollment) * 100 : 0}
                            sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
                <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                  Recent Activity
                </Typography>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <List>
                    {stats.recentActivity.map((activity) => (
                      <ListItem key={activity.id} divider>
                        <ListItemText
                          primary={activity.description}
                          secondary={formatDate(activity.timestamp)}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No recent activity found.
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
