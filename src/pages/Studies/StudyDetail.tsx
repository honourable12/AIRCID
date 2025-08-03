import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { StudyService } from '@/services/studyService';
import { Study } from '@/types';

const StudyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStudy(id);
    }
  }, [id]);

  const fetchStudy = async (studyId: string) => {
    try {
      setLoading(true);
      const response = await StudyService.getStudy(studyId);
      if (response.success && response.data) {
        setStudy(response.data);
      } else {
        setError(response.message || 'Failed to load study');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!study) return;
    
    try {
      await StudyService.deleteStudy(study.id);
      navigate('/studies');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete study');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'recruiting': return 'info';
      case 'completed': return 'default';
      case 'draft': return 'warning';
      default: return 'default';
    }
  };

  const getEnrollmentPercentage = () => {
    if (!study?.targetEnrollment || !study?.currentEnrollment) return 0;
    return Math.round((study.currentEnrollment / study.targetEnrollment) * 100);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/studies')}
        >
          Back to Studies
        </Button>
      </Box>
    );
  }

  if (!study) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Study not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/studies')}
        >
          Back to Studies
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/studies')}
            sx={{ mb: 2 }}
          >
            Back to Studies
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {study.title}
          </Typography>
          <Box display="flex" gap={1} alignItems="center" mb={2}>
            <Chip
              label={study.status}
              color={getStatusColor(study.status) as any}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              ID: {study.id}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton
            color="primary"
            onClick={() => setEditDialogOpen(true)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Study Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Study Overview
              </Typography>
              <Typography variant="body1" paragraph>
                {study.description}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Principal Investigator
                  </Typography>
                  <Typography variant="body1">
                    {study.principalInvestigator}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Study Period
                  </Typography>
                  <Typography variant="body1">
                    {new Date(study.startDate).toLocaleDateString()} - {new Date(study.endDate).toLocaleDateString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Study Timeline */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Study Timeline & Milestones
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Study Start"
                    secondary={new Date(study.startDate).toLocaleDateString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Current Phase"
                    secondary={study.status === 'active' ? 'Data Collection' : 'Protocol Development'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Expected Completion"
                    secondary={new Date(study.endDate).toLocaleDateString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Enrollment Stats */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Enrollment Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {study.currentEnrollment || 0} / {study.targetEnrollment} patients
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getEnrollmentPercentage()}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="h4" align="center" sx={{ mt: 2 }}>
                  {getEnrollmentPercentage()}%
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PeopleIcon />}
                onClick={() => navigate(`/studies/${study.id}/matches`)}
              >
                View Patient Matches
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={() => navigate('/forms')}
                  fullWidth
                >
                  Manage Forms
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  fullWidth
                >
                  Export Data
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/patients')}
                  fullWidth
                >
                  Manage Patients
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Study</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{study.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudyDetail;
