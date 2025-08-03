import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { StudyService } from '@/services/studyService';
import { patientsService } from '@/services/patientsService';
import { Study } from '@/types';
import { Patient } from '@/services/patientsService';

const PatientMatches: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<Study | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [matchedPatients, setMatchedPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (studyId: string) => {
    try {
      setLoading(true);
      
      // Fetch study details
      const studyResponse = await StudyService.getStudy(studyId);
      if (studyResponse.success && studyResponse.data) {
        setStudy(studyResponse.data);
      }

      // Fetch all patients
      const patientsResponse = await patientsService.getAllPatients({ pageSize: 100 });
      if (patientsResponse.data) {
        setPatients(patientsResponse.data);
        
        // Filter patients already enrolled in this study
        const alreadyEnrolled = patientsResponse.data.filter(p => 
          p.enrolledStudies.includes(studyId)
        );
        setMatchedPatients(alreadyEnrolled);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchTerm === '' || 
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAge = ageFilter === '' || 
      (ageFilter === '18-30' && patient.age >= 18 && patient.age <= 30) ||
      (ageFilter === '31-50' && patient.age >= 31 && patient.age <= 50) ||
      (ageFilter === '51-70' && patient.age >= 51 && patient.age <= 70) ||
      (ageFilter === '70+' && patient.age > 70);
    
    const matchesGender = genderFilter === '' || patient.gender === genderFilter;
    
    return matchesSearch && matchesAge && matchesGender && 
           !patient.enrolledStudies.includes(id || '');
  });

  const enrollPatient = async (patientId: string) => {
    if (!id) return;
    
    try {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        // Update patient's enrolled studies
        await patientsService.updatePatient(patientId, {
          ...patient,
          enrolledStudies: [...patient.enrolledStudies, id],
        });
        
        // Refresh data
        fetchData(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll patient');
    }
  };

  const unenrollPatient = async (patientId: string) => {
    if (!id) return;
    
    try {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        // Update patient's enrolled studies
        await patientsService.updatePatient(patientId, {
          ...patient,
          enrolledStudies: patient.enrolledStudies.filter(studyId => studyId !== id),
        });
        
        // Refresh data
        fetchData(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unenroll patient');
    }
  };

  const getMatchScore = (patient: Patient) => {
    // Simple matching algorithm based on study requirements
    let score = 0;
    
    // Age criteria (example)
    if (patient.age >= 18 && patient.age <= 65) score += 25;
    
    // Medical history relevance (example)
    if (patient.medicalHistory.length > 0) score += 25;
    
    // Contact completeness
    if (patient.email && patient.phone) score += 25;
    
    // Address completeness
    if (patient.address.street && patient.address.city && patient.address.state) score += 25;
    
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
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

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/studies/${id}`)}
            sx={{ mb: 2 }}
          >
            Back to Study
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Matching
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {study?.title}
          </Typography>
        </Box>
        <Badge badgeContent={matchedPatients.length} color="primary">
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/patients')}
          >
            Add New Patient
          </Button>
        </Badge>
      </Box>

      <Grid container spacing={3}>
        {/* Enrolled Patients */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" />
                Enrolled Patients ({matchedPatients.length})
              </Typography>
              <List>
                {matchedPatients.map((patient) => (
                  <ListItem key={patient.id}>
                    <ListItemText
                      primary={`${patient.firstName} ${patient.lastName}`}
                      secondary={`${patient.email} • Age: ${patient.age} • ${patient.gender}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => unenrollPatient(patient.id)}
                        size="small"
                        color="error"
                      >
                        <CancelIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {matchedPatients.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="No patients enrolled yet"
                      secondary="Start matching patients from the available pool"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Patients */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon />
                Available Patients ({filteredPatients.length})
              </Typography>
              
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Age Range</InputLabel>
                    <Select
                      value={ageFilter}
                      label="Age Range"
                      onChange={(e) => setAgeFilter(e.target.value)}
                    >
                      <MenuItem value="">All Ages</MenuItem>
                      <MenuItem value="18-30">18-30</MenuItem>
                      <MenuItem value="31-50">31-50</MenuItem>
                      <MenuItem value="51-70">51-70</MenuItem>
                      <MenuItem value="70+">70+</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={genderFilter}
                      label="Gender"
                      onChange={(e) => setGenderFilter(e.target.value)}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              {/* Patient List */}
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {filteredPatients.map((patient) => {
                  const matchScore = getMatchScore(patient);
                  return (
                    <ListItem key={patient.id}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            {`${patient.firstName} ${patient.lastName}`}
                            <Chip
                              label={`${matchScore}% match`}
                              size="small"
                              color={getScoreColor(matchScore) as any}
                            />
                          </Box>
                        }
                        secondary={`${patient.email} • Age: ${patient.age} • ${patient.gender}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => enrollPatient(patient.id)}
                          sx={{ ml: 1 }}
                        >
                          Enroll
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="No matching patients found"
                      secondary="Try adjusting your search criteria"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientMatches;
