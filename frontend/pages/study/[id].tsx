'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  Fab,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Chat as ChatIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import ProtectedRoute from '../../components/ProtectedRoute';
import JsonFormRenderer from '../../components/JsonFormRenderer';
import GenAIChatSidebar from '../../components/GenAIChatSidebar';
import CriteriaRefiner from '../../components/CriteriaRefiner';
import FormSchemaGenerator from '../../components/FormSchemaGenerator';
import DocumentUpload from '../../components/DocumentUpload';
import TextSummarizer from '../../components/TextSummarizer';
import { useChat } from '../../context/ChatContext';
import type { Study, FormSchema } from '../../types';

const StudyDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toggleChat, isOpen: isChatOpen } = useChat();
  
  const [study, setStudy] = useState<Study | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock study data
  useEffect(() => {
    if (id) {
      const mockStudies: Record<string, Study> = {
        'study_001': {
          id: 'study_001',
          title: 'Phase II Trial of Drug X in Rheumatoid Arthritis',
          objective: 'Evaluate efficacy and safety of Drug X in moderate to severe RA patients',
          status: 'active',
          created_date: '2024-01-15',
          enrollment_target: 120,
          enrollment_current: 87,
          last_updated: '2024-12-19'
        },
        'study_002': {
          id: 'study_002',
          title: 'Biomarker Discovery Study - Lung Cancer',
          objective: 'Identify novel biomarkers for early lung cancer detection',
          status: 'active',
          created_date: '2024-02-01',
          enrollment_target: 200,
          enrollment_current: 156,
          last_updated: '2024-12-18'
        },
        'new': {
          id: 'new',
          title: 'New Clinical Study',
          objective: 'Define your study objective here...',
          status: 'draft',
          created_date: new Date().toISOString().split('T')[0],
          enrollment_target: 0,
          enrollment_current: 0,
          last_updated: new Date().toISOString().split('T')[0]
        }
      };

      const foundStudy = mockStudies[id as string];
      if (foundStudy) {
        setStudy(foundStudy);
      }
      setIsLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleFormSubmit = (formData: any) => {
    console.log('Study form submitted:', {
      studyId: id,
      formData,
      timestamp: new Date().toISOString()
    });
  };

  const handleSchemaGenerated = (newSchema: FormSchema) => {
    setFormSchema(newSchema);
  };

  const handleCriteriaUpdate = (refined: any) => {
    console.log('Criteria updated for study:', id, refined);
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Typography>Loading study...</Typography>
        </Box>
      </ProtectedRoute>
    );
  }

  if (!study) {
    return (
      <ProtectedRoute>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">
            Study not found. Please check the study ID and try again.
          </Alert>
        </Container>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Box sx={{ flexGrow: 1 }}>
        {/* App Bar */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <IconButton
              color="inherit"
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              <BackIcon />
            </IconButton>
            
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {study.title}
            </Typography>
            
            <Chip
              label={study.status.toUpperCase()}
              color={getStatusColor(study.status)}
              size="small"
              sx={{ mr: 2 }}
            />
            
            <IconButton color="inherit" onClick={toggleChat}>
              <ChatIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Study Header */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h4" gutterBottom color="primary">
                  {study.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {study.objective}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Study Progress
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {study.enrollment_current} / {study.enrollment_target}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Participants Enrolled
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(study.created_date).toLocaleDateString()}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        Updated: {new Date(study.last_updated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* AI-Powered Tools */}
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            AI-Powered Research Tools
          </Typography>

          {/* Form Schema Generator */}
          <FormSchemaGenerator
            studyId={study.id}
            onSchemaGenerated={handleSchemaGenerated}
          />

          {/* Criteria Refiner */}
          <CriteriaRefiner
            onCriteriaUpdate={handleCriteriaUpdate}
            placeholder="Enter inclusion/exclusion criteria for this study..."
          />

          {/* Document Upload for Study */}
          <DocumentUpload
            onDocumentUploaded={(doc) => {
              console.log('Study document uploaded:', doc);
            }}
          />

          {/* Text Summarizer for Study Content */}
          <TextSummarizer
            context={`clinical study: ${study.title}`}
            onSummaryGenerated={(summary) => {
              console.log('Study summary generated:', summary);
            }}
          />

          <Divider sx={{ my: 4 }} />

          {/* Data Entry Form */}
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            Data Collection Form
          </Typography>

          <JsonFormRenderer
            studyId={study.id}
            schema={formSchema || undefined}
            title={`${study.title} - Data Entry`}
            onSubmit={handleFormSubmit}
          />

          {/* Study Actions */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Study Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => {
                  console.log('Saving study:', study.id);
                  alert('Study saved successfully!');
                }}
              >
                Save Study
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<TimelineIcon />}
                onClick={() => {
                  console.log('Viewing timeline for study:', study.id);
                }}
              >
                View Timeline
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  window.location.reload();
                }}
              >
                Refresh Data
              </Button>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                Development Note
              </Typography>
              <Typography variant="body2">
                Form submissions are logged to console. Production integration with 
                <code>/api/forms/submit</code> and document upload endpoints will be 
                implemented in future versions.
              </Typography>
            </Alert>
          </Paper>
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

export default StudyDetailPage;