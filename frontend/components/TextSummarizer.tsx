import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Summarize as SummarizeIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { GenAIService } from '../services/genaiService';
import { useAuth } from '../context/AuthContext';

interface TextSummarizerProps {
  initialText?: string;
  context?: string;
  onSummaryGenerated?: (summary: string) => void;
}

const TextSummarizer: React.FC<TextSummarizerProps> = ({
  initialText = '',
  context = 'clinical research document',
  onSummaryGenerated
}) => {
  const { token } = useAuth();
  const [text, setText] = useState(initialText);
  const [summaryContext, setSummaryContext] = useState(context);
  const [targetLength, setTargetLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [summary, setSummary] = useState<string>('');
  const [rawOutput, setRawOutput] = useState<string>('');
  const [showRaw, setShowRaw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleSummarize = async () => {
    if (!text.trim() || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await GenAIService.summarizeText(
        text.trim(),
        summaryContext,
        token,
        targetLength
      );

      setSummary(result.summary || '');
      setRawOutput(result.raw_output || '');
      setExpanded(true);

      if (onSummaryGenerated && result.summary) {
        onSummaryGenerated(result.summary);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (summary) {
      try {
        await navigator.clipboard.writeText(summary);
        // Could add a toast notification here
      } catch (err) {
        console.error('Failed to copy summary:', err);
      }
    }
  };

  const getLengthDescription = (length: string) => {
    switch (length) {
      case 'short': return '1-2 sentences';
      case 'medium': return '1-2 paragraphs';
      case 'long': return '3+ paragraphs';
      default: return '';
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SummarizeIcon color="primary" />
        <Typography variant="h6" color="primary">
          AI Text Summarizer
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Generate concise summaries of research documents, reports, or any text content.
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text content here to generate a summary..."
        disabled={isLoading}
        sx={{ mb: 2 }}
        label="Text to Summarize"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          value={summaryContext}
          onChange={(e) => setSummaryContext(e.target.value)}
          placeholder="e.g., clinical trial report, research paper, patient notes"
          disabled={isLoading}
          sx={{ flex: 1 }}
          label="Context"
          size="small"
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Length</InputLabel>
          <Select
            value={targetLength}
            onChange={(e) => setTargetLength(e.target.value as 'short' | 'medium' | 'long')}
            disabled={isLoading}
            label="Length"
          >
            <MenuItem value="short">Short</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="long">Long</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Target length: {getLengthDescription(targetLength)}
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          onClick={handleSummarize}
          disabled={!text.trim() || isLoading || !token}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SummarizeIcon />}
        >
          {isLoading ? 'Summarizing...' : 'Generate Summary'}
        </Button>

        {summary && (
          <Button
            variant="outlined"
            onClick={handleCopySummary}
            startIcon={<CopyIcon />}
          >
            Copy Summary
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {summary && (
        <Accordion 
          expanded={expanded} 
          onChange={(_, isExpanded) => setExpanded(isExpanded)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SummarizeIcon color="secondary" />
              <Typography variant="subtitle1">
                Generated Summary
              </Typography>
              <Chip label="AI Generated" size="small" color="warning" variant="outlined" />
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Summary ({targetLength} length):
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {summary}
                </Typography>
              </Paper>
            </Box>

            {rawOutput && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showRaw}
                      onChange={(e) => setShowRaw(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Show raw LLM output"
                  sx={{ mb: 2 }}
                />

                {showRaw && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Raw LLM Output:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'warning.50' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                        {rawOutput}
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </>
            )}

            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
              <Typography variant="caption" color="warning.main">
                ⚠️ This is an AI-generated summary. Please review for accuracy and 
                completeness before using in official documentation or research.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default TextSummarizer;