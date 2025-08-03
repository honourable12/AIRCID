import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { formsService, Form, FormField } from '@/services/formsService';

const DynamicForm: React.FC = () => {
  const { id: studyId, formId } = useParams<{ id: string; formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (formId) {
      fetchForm(formId);
    }
  }, [formId]);

  const fetchForm = async (id: string) => {
    try {
      setLoading(true);
      const response = await formsService.getForm(id);
      setForm(response);
      
      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      response.fields.forEach((field) => {
        switch (field.type) {
          case 'checkbox':
            initialData[field.id] = false;
            break;
          case 'select':
          case 'radio':
            initialData[field.id] = field.options?.[0] || '';
            break;
          default:
            initialData[field.id] = '';
        }
      });
      setFormData(initialData);
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form) return;

    // Validate required fields
    const missingFields = form.fields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      setError(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setSaving(true);
      
      // In a real app, you would submit this to a form submissions endpoint
      console.log('Form submission:', {
        formId: form.id,
        studyId,
        data: formData,
        timestamp: new Date().toISOString(),
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Form submitted successfully!');
      navigate(`/studies/${studyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            margin="normal"
          />
        );

      case 'number':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, parseFloat(e.target.value) || '')}
            required={field.required}
            margin="normal"
          />
        );

      case 'date':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        );

      case 'textarea':
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            multiline
            rows={4}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            margin="normal"
          />
        );

      case 'select':
        return (
          <FormControl key={field.id} fullWidth margin="normal" required={field.required}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl key={field.id} component="fieldset" margin="normal" required={field.required}>
            <FormLabel component="legend">{field.label}</FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
                <FormControlLabel
                  key={option}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
            }
            label={field.label}
            required={field.required}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !form) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/studies/${studyId}`)}
        >
          Back to Study
        </Button>
      </Box>
    );
  }

  if (!form) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Form not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/studies/${studyId}`)}
        >
          Back to Study
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
            onClick={() => navigate(`/studies/${studyId}`)}
            sx={{ mb: 2 }}
          >
            Back to Study
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {form.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {form.description}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PreviewIcon />}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form Fields
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {previewMode ? (
                // Preview Mode - Read-only display of form data
                <Box>
                  {form.fields.map((field) => (
                    <Box key={field.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {field.label} {field.required && '*'}
                      </Typography>
                      <Typography variant="body1" sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {formData[field.id]?.toString() || 'No value'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                // Edit Mode - Interactive form fields
                <Box component="form">
                  {form.fields.map(renderField)}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Form Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={saving || previewMode}
                  fullWidth
                >
                  {saving ? 'Submitting...' : 'Submit Form'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/forms')}
                  fullWidth
                >
                  Manage Forms
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                Form Info
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Fields:</strong> {form.fields.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Required:</strong> {form.fields.filter(f => f.required).length}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Status:</strong> {form.isActive ? 'Active' : 'Inactive'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DynamicForm;
