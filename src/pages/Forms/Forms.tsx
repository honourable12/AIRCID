import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { formsService, Form, FormField, CreateFormRequest } from '@/services/formsService';

const Forms: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'preview'>('list');

  // Form state
  const [formData, setFormData] = useState<CreateFormRequest>({
    title: '',
    description: '',
    fields: [],
  });

  // Field creation state
  const [newField, setNewField] = useState<FormField>({
    id: '',
    type: 'text',
    label: '',
    required: false,
    options: [],
  });

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formsService.getAllForms();
      setForms(response);
      setError(null);
    } catch (err) {
      setError('Failed to fetch forms');
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (form?: Form) => {
    if (form) {
      setSelectedForm(form);
      setFormData({
        title: form.title,
        description: form.description,
        fields: form.fields,
        studyId: form.studyId,
      });
      setIsEditing(true);
    } else {
      setSelectedForm(null);
      setFormData({
        title: '',
        description: '',
        fields: [],
      });
      setIsEditing(false);
    }
    setOpenDialog(true);
    setViewMode('create');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedForm(null);
    setIsEditing(false);
    setViewMode('list');
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedForm) {
        await formsService.updateForm(selectedForm.id, formData);
      } else {
        await formsService.createForm(formData);
      }
      handleCloseDialog();
      fetchForms();
    } catch (err) {
      setError(isEditing ? 'Failed to update form' : 'Failed to create form');
      console.error('Error saving form:', err);
    }
  };

  const handleDelete = async (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      try {
        await formsService.deleteForm(formId);
        fetchForms();
      } catch (err) {
        setError('Failed to delete form');
        console.error('Error deleting form:', err);
      }
    }
  };

  const addField = () => {
    if (newField.label) {
      const fieldWithId = {
        ...newField,
        id: `field_${Date.now()}`,
      };
      setFormData({
        ...formData,
        fields: [...formData.fields, fieldWithId],
      });
      setNewField({
        id: '',
        type: 'text',
        label: '',
        required: false,
        options: [],
      });
    }
  };

  const removeField = (fieldId: string) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter(field => field.id !== fieldId),
    });
  };

  const renderFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'email': return '📧';
      case 'date': return '📅';
      case 'select': return '📋';
      case 'checkbox': return '☑️';
      case 'radio': return '🔘';
      case 'textarea': return '📄';
      default: return '❓';
    }
  };

  const renderFormPreview = (form: Form) => (
    <Box>
      <Typography variant="h5" gutterBottom>
        {form.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        {form.description}
      </Typography>
      <Divider sx={{ my: 2 }} />
      {form.fields.map((field, index) => (
        <Box key={field.id} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
          </Typography>
          {field.type === 'text' && <TextField fullWidth variant="outlined" placeholder={`Enter ${field.label.toLowerCase()}`} />}
          {field.type === 'number' && <TextField fullWidth type="number" variant="outlined" placeholder={`Enter ${field.label.toLowerCase()}`} />}
          {field.type === 'email' && <TextField fullWidth type="email" variant="outlined" placeholder={`Enter ${field.label.toLowerCase()}`} />}
          {field.type === 'date' && <TextField fullWidth type="date" variant="outlined" InputLabelProps={{ shrink: true }} />}
          {field.type === 'textarea' && <TextField fullWidth multiline rows={3} variant="outlined" placeholder={`Enter ${field.label.toLowerCase()}`} />}
          {field.type === 'select' && (
            <FormControl fullWidth>
              <Select displayEmpty>
                <MenuItem value="">Select {field.label.toLowerCase()}</MenuItem>
                {field.options?.map((option, idx) => (
                  <MenuItem key={idx} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      ))}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Forms
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssignmentIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Form
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Forms List */}
      <Grid container spacing={3}>
        {forms.map((form) => (
          <Grid item xs={12} md={6} lg={4} key={form.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2">
                    {form.title ?? (form as any).name}
                  </Typography>
                <Box>
                    <Chip
                      label={(form.isActive ?? true) ? 'Active' : 'Inactive'}
                      color={(form.isActive ?? true) ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {form.description}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Fields: {form.fields?.length ?? Object.keys((form as any).schema?.properties || {}).length ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Version: {form.version ?? 'N/A'}
                </Typography>
                <Box mt={2} display="flex" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedForm(form);
                      setViewMode('preview');
                      setOpenDialog(true);
                    }}
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(form)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(form.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit/Preview Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {viewMode === 'preview' ? 'Form Preview' : isEditing ? 'Edit Form' : 'Create New Form'}
        </DialogTitle>
        <DialogContent>
          {viewMode === 'preview' && selectedForm ? (
            renderFormPreview(selectedForm)
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Form Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Form Fields
                </Typography>
              </Grid>
              
              {/* Add New Field */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Add New Field
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Field Label"
                          value={newField.label}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth>
                          <InputLabel>Field Type</InputLabel>
                          <Select
                            value={newField.type}
                            label="Field Type"
                            onChange={(e) => setNewField({ ...newField, type: e.target.value as any })}
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="number">Number</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="date">Date</MenuItem>
                            <MenuItem value="textarea">Textarea</MenuItem>
                            <MenuItem value="select">Select</MenuItem>
                            <MenuItem value="checkbox">Checkbox</MenuItem>
                            <MenuItem value="radio">Radio</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      {(newField.type === 'select' || newField.type === 'radio') && (
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Options (comma separated)"
                            value={newField.options?.join(', ') || ''}
                            onChange={(e) => setNewField({
                              ...newField,
                              options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                            })}
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={2}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={addField}
                          disabled={!newField.label}
                        >
                          Add Field
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Existing Fields */}
              {formData.fields.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Form Fields ({formData.fields.length})
                      </Typography>
                      <List>
                        {formData.fields.map((field, index) => (
                          <ListItem key={field.id} divider={index < formData.fields.length - 1}>
                            <ListItemText
                              primary={`${renderFieldTypeIcon(field.type)} ${field.label}`}
                              secondary={`Type: ${field.type} ${field.required ? '(Required)' : ''}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={() => removeField(field.id)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {viewMode === 'preview' ? 'Close' : 'Cancel'}
          </Button>
          {viewMode !== 'preview' && (
            <Button onClick={handleSubmit} variant="contained">
              {isEditing ? 'Update' : 'Create'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Forms;
