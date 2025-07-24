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
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoFixHigh as RefineIcon,
  LightbulbOutlined as SuggestionIcon
} from '@mui/icons-material';
import { GenAIService } from '../services/genaiService';
import { useAuth } from '../context/AuthContext';
import type { CriteriaAugmentation } from '../types';

interface CriteriaRefinerProps {
  onCriteriaUpdate?: (refined: CriteriaAugmentation) => void;
  initialCriteria?: string;
  placeholder?: string;
}

const CriteriaRefiner: React.FC<CriteriaRefinerProps> = ({
  onCriteriaUpdate,
  initialCriteria = '',
  placeholder = 'Enter inclusion/exclusion criteria in plain text...'
}) => {
  const { token } = useAuth();
  const [criteria, setCriteria] = useState(initialCriteria);
  const [refinedResult, setRefinedResult] = useState<CriteriaAugmentation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleRefine = async () => {
    if (!criteria.trim() || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await GenAIService.augmentCriteria(criteria.trim(), token);
      setRefinedResult(result);
      setExpanded(true);
      
      if (onCriteriaUpdate) {
        onCriteriaUpdate(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine criteria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyClearer = () => {
    if (refinedResult?.clearer_wording) {
      setCriteria(refinedResult.clearer_wording);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <RefineIcon color="primary" />
        <Typography variant="h6" color="primary">
          AI Criteria Refiner
        </Typography>
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        value={criteria}
        onChange={(e) => setCriteria(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleRefine}
          disabled={!criteria.trim() || isLoading || !token}
          startIcon={isLoading ? <CircularProgress size={20} /> : <RefineIcon />}
        >
          {isLoading ? 'Refining...' : 'Refine Criteria'}
        </Button>

        {refinedResult && (
          <Button
            variant="outlined"
            onClick={handleApplyClearer}
            startIcon={<SuggestionIcon />}
          >
            Apply Clearer Wording
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {refinedResult && (
        <Accordion 
          expanded={expanded} 
          onChange={(_, isExpanded) => setExpanded(isExpanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SuggestionIcon color="secondary" />
              <Typography variant="subtitle1">
                AI Refinement Results
              </Typography>
              <Chip label="AI Generated" size="small" color="warning" variant="outlined" />
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Clearer Wording:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {refinedResult.clearer_wording}
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Suggested Rules:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {refinedResult.suggested_rules.map((rule, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'primary.50' }}
                  >
                    <Typography variant="body2">
                      {index + 1}. {rule}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Box>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
              <Typography variant="caption" color="warning.main">
                ⚠️ These are AI-generated suggestions. Please review and validate 
                all criteria with your research team and regulatory requirements.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default CriteriaRefiner;