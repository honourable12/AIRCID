'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  Paper,
  Divider,
  Button,
  Alert,
  Chip,
  CircularProgress,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  SmartToy as AIIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { GenAIService } from '../services/genaiService';
import type { ChatMessage } from '../types';

interface GenAIChatSidebarProps {
  width?: number;
}

const GenAIChatSidebar: React.FC<GenAIChatSidebarProps> = ({ width = 400 }) => {
  const { isOpen, closeChat, messages, addMessage, clearMessages } = useChat();
  const { token } = useAuth();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !token || isLoading) return;

    const currentQuestion = question.trim();
    setQuestion('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await GenAIService.askQuestion(
        currentQuestion,
        token,
        messages,
        3 // num_context_chunks
      );

      addMessage({
        question: currentQuestion,
        answer: response.answer || 'No response received',
        sources: response.sources || []
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      
      // Add error message to chat for better UX
      addMessage({
        question: currentQuestion,
        answer: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        sources: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    clearMessages();
    setError(null);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(timestamp);
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={closeChat}
      variant="persistent"
      sx={{
        width: isOpen ? width : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
          borderLeft: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box 
          sx={{ 
            p: 2, 
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" color="primary">
              AI Assistant
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Clear conversation">
              <span style={{ display: 'inline-block' }}>
                <IconButton size="small" onClick={handleClearChat} disabled={messages.length === 0}>
                  <ClearIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Close chat">
              <IconButton size="small" onClick={closeChat}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <AIIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Ask me anything about your clinical studies, patient criteria, or research questions.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map((message) => (
                <React.Fragment key={message.id}>
                  {/* User Question */}
                  <ListItem sx={{ mb: 2, flexDirection: 'column', alignItems: 'stretch', p: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          You • {formatTimestamp(message.timestamp)}
                        </Typography>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 2, 
                            mt: 0.5,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText'
                          }}
                        >
                          <Typography variant="body2">
                            {message.question}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>

                    {/* AI Answer */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                        <AIIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          AI Assistant
                        </Typography>
                        <Paper elevation={1} sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.answer}
                          </Typography>
                          
                          {message.sources && message.sources.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Sources:
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {message.sources.map((source, idx) => (
                                  <Chip
                                    key={idx}
                                    label={source}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              </Box>
                            </Box>
                          )}
                          
                          <Chip
                            label="AI Generated"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ mt: 2, fontSize: '0.65rem' }}
                          />
                        </Paper>
                      </Box>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>

        {/* Error Display */}
        {error && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Alert 
              severity="error" 
              size="small"
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Input Form */}
        <Box 
          sx={{ 
            p: 2, 
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Ask about studies, criteria, patients..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isLoading || !token}
                multiline
                maxRows={3}
              />
              <IconButton
                type="submit"
                color="primary"
                disabled={!question.trim() || isLoading || !token}
                size="small"
              >
                {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
              </IconButton>
            </Box>
          </form>
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {messages.length > 0 && `${messages.length} message(s) in conversation`}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default GenAIChatSidebar;