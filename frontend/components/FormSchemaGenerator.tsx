'use client';
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as GenerateIcon,
  Visibility as PreviewIcon,
  GetApp as ApplyIcon
} from '@mui/icons-material';
import { GenAIService } from '../services/genaiService';
import { useAuth } from '../context/AuthContext';
import JsonFormRenderer from './JsonFormRenderer';
import type { FormSchema } from '../types';

interface FormSchemaGeneratorProps {
  onSchemaGenerated?: (schema: FormSchema) => void;
  studyId?: string;
}

const FormSchemaGenerator: React.FC<FormSchemaGeneratorProps> = ({
  onSchemaGenerated,
  studyId = 'preview'
}) => {
  const { token } = useAuth();
  const [objective, setObjective] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState<FormSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!objective.trim() || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await GenAIService.generateFormSchema(objective.trim(), token);
      setGeneratedSchema(response);
      setExpanded(true);
      setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate form schema');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySchema = () => {
    if (generatedSchema && onSchemaGenerated) {
      onSchemaGenerated(generatedSchema);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GenerateIcon color="primary" />
        <Typography variant="h6" color="primary">
          AI Form Schema Generator
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Describe your study objective and AI will generate a comprehensive data collection form.
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={4}
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
        placeholder="Example: This is a randomized controlled trial to evaluate the efficacy of Drug X in treating patients with moderate to severe rheumatoid arthritis. We need to collect baseline demographics, disease severity scores, laboratory values, and safety assessments..."
        disabled={isLoading}
        sx={{ mb: 2 }}
        label="Study Objective"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!objective.trim() || isLoading || !token}
          startIcon={isLoading ? <CircularProgress size={20} /> : <GenerateIcon />}
        >
          {isLoading ? 'Generating...' : 'Generate Form Schema'}
        </Button>

        {generatedSchema && (
          <>
            <Button
              variant="outlined"
              onClick={togglePreview}
              startIcon={<PreviewIcon />}
            >
              {showPreview ? 'Hide Preview' : 'Preview Form'}
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={handleApplySchema}
              startIcon={<ApplyIcon />}
            >
              Apply Schema
            </Button>
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {generatedSchema && (
        <Accordion 
          expanded={expanded} 
          onChange={(_, isExpanded) => setExpanded(isExpanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GenerateIcon color="secondary" />
              <Typography variant="subtitle1">
                Generated Form Schema
              </Typography>
              <Chip label="AI Generated" size="small" color="warning" variant="outlined" />
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Form Title: {generatedSchema.title || 'Generated Study Form'}
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  JSON Schema:
                </Typography>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  overflow: 'auto',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(generatedSchema, null, 2)}
                </pre>
              </Paper>

              {showPreview && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Form Preview:
                  </Typography>
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <JsonFormRenderer
                      studyId={studyId}
                      schema={generatedSchema}
                      title="Preview: Generated Form"
                      onSubmit={(data) => {
                        console.log('Preview form data:', data);
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
              <Typography variant="caption" color="warning.main">
                ⚠️ This is an AI-generated form schema. Please review all fields, 
                validation rules, and data types before using in production. 
                Consider regulatory requirements and study protocol specifications.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default FormSchemaGenerator;