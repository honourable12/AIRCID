'use client';
import React, { useState } from 'react';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { FormService } from '../services/formService';
import { useAuth } from '../context/AuthContext';
import type { FormSchema } from '../types';

interface JsonFormRendererProps {
  studyId: string;
  schema?: FormSchema;
  initialData?: any;
  onSubmit?: (data: any) => void;
  title?: string;
}

const JsonFormRenderer: React.FC<JsonFormRendererProps> = ({
  studyId,
  schema,
  initialData = {},
  onSubmit,
  title = 'Study Data Entry Form'
}) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Default schema if none provided
  const defaultSchema: FormSchema = {
    type: 'object',
    title: 'Clinical Study Form',
    properties: {
      patientId: {
        type: 'string',
        title: 'Patient ID',
        description: 'Unique identifier for the patient'
      },
      enrollmentDate: {
        type: 'string',
        format: 'date',
        title: 'Enrollment Date'
      },
      demographics: {
        type: 'object',
        title: 'Demographics',
        properties: {
          age: { 
            type: 'integer', 
            title: 'Age', 
            minimum: 0, 
            maximum: 120 
          },
          gender: { 
            type: 'string', 
            title: 'Gender',
            enum: ['Male', 'Female', 'Other', 'Prefer not to say']
          }
        }
      },
      notes: {
        type: 'string',
        title: 'Additional Notes',
        format: 'textarea'
      }
    },
    required: ['patientId', 'enrollmentDate']
  };

  const currentSchema = schema || defaultSchema;

  const handleSubmit = async ({ formData: data }: { formData: any }) => {
    if (!token) {
      setSubmitMessage({ type: 'error', text: 'Authentication required' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Call the provided onSubmit callback if available
      if (onSubmit) {
        onSubmit(data);
      }

      // Save to backend (placeholder for now)
      await FormService.saveForm(studyId, data, token);
      
      setSubmitMessage({ 
        type: 'success', 
        text: 'Form submitted successfully!' 
      });

      // Log to console as specified in requirements
      console.log('Form submission for study:', studyId);
      console.log('Form data:', data);

    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitMessage({ 
        type: 'error', 
        text: 'Failed to submit form. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = ({ formData: data }: { formData: any }) => {
    setFormData(data);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" gutterBottom color="primary">
        {title}
      </Typography>
      
      {submitMessage && (
        <Alert 
          severity={submitMessage.type} 
          sx={{ mb: 2 }}
          onClose={() => setSubmitMessage(null)}
        >
          {submitMessage.text}
        </Alert>
      )}

      <Form
        schema={currentSchema}
        formData={formData}
        validator={validator}
        onChange={handleChange}
        onSubmit={handleSubmit}
        disabled={isSubmitting}
        uiSchema={{
          notes: {
            'ui:widget': 'textarea',
            'ui:options': {
              rows: 4
            }
          },
          demographics: {
            'ui:order': ['age', 'gender']
          }
        }}
      >
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
            size="large"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
          
          <Button
            type="button"
            variant="outlined"
            onClick={() => {
              console.log('Current form data:', formData);
              setSubmitMessage({ 
                type: 'success', 
                text: 'Form data logged to console' 
              });
            }}
          >
            Debug: Log Data
          </Button>
        </Box>
      </Form>
    </Paper>
  );
};

export default JsonFormRenderer;