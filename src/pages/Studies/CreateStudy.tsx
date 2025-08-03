import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreateStudyRequest } from '@/types';
import { StudyService } from '@/services/studyService';

const studySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'recruiting', 'completed', 'paused']).optional(),
  principalInvestigator: z.string().min(1, 'Principal Investigator is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetEnrollment: z.number().min(1, 'Target enrollment must be at least 1').optional(),
});

type StudyFormData = z.infer<typeof studySchema>;

const CreateStudy: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StudyFormData>({
    resolver: zodResolver(studySchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'active',
      principalInvestigator: '',
      startDate: '',
      endDate: '',
      targetEnrollment: 100,
    },
  });

  const onSubmit = async (data: StudyFormData) => {
    setIsLoading(true);
    try {
      console.log('Submitting study data:', data);
      
      // Convert form data to API format
      const studyData: CreateStudyRequest = {
        title: data.title,
        description: data.description || undefined,
        status: data.status || 'active',
        principalInvestigator: data.principalInvestigator,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        targetEnrollment: data.targetEnrollment || undefined,
      };

      const response = await StudyService.createStudy(studyData);
      
      if (response.success) {
        console.log('Study created successfully:', response);
        navigate('/studies');
      } else {
        console.error('Failed to create study:', response);
        alert('Failed to create study: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating study:', error);
      alert('Error creating study: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/studies')}
        >
          Back to Studies
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Create New Study
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Study Title"
                            error={!!errors.title}
                            helperText={errors.title?.message}
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Description"
                            multiline
                            rows={4}
                            error={!!errors.description}
                            helperText={errors.description?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="principalInvestigator"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Principal Investigator"
                            error={!!errors.principalInvestigator}
                            helperText={errors.principalInvestigator?.message}
                            required
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select {...field} label="Status">
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="recruiting">Recruiting</MenuItem>
                              <MenuItem value="completed">Completed</MenuItem>
                              <MenuItem value="paused">Paused</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.startDate}
                            helperText={errors.startDate?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.endDate}
                            helperText={errors.endDate?.message}
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Controller
                        name="targetEnrollment"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Target Enrollment"
                            type="number"
                            inputProps={{ min: 1 }}
                            error={!!errors.targetEnrollment}
                            helperText={errors.targetEnrollment?.message}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/studies')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Study'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default CreateStudy;
