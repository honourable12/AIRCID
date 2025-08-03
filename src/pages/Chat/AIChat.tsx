import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  Avatar,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { aiService, ChatMessage, ChatRequest } from '@/services/aiService';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: 'Hello! I\'m your AI assistant for clinical research. I can help you with study design, patient criteria, regulatory compliance, and more. What would you like to know?',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message: currentMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);
    setError(null);

    try {
      const request: ChatRequest = {
        message: currentMessage,
        context: {
          previousMessages: messages.slice(-5), // Send last 5 messages for context
        }
      };

      const response = await aiService.getChatResponse(request);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: response.response,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        context: response.context,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Add suggestions if provided
      if (response.suggestions && response.suggestions.length > 0) {
        const suggestionsMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          message: `Here are some related topics you might want to explore: ${response.suggestions.join(', ')}`,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, suggestionsMessage]);
      }
    } catch (err) {
      setError('Failed to get AI response. Please try again.');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        message: 'Hello! I\'m your AI assistant for clinical research. I can help you with study design, patient criteria, regulatory compliance, and more. What would you like to know?',
        sender: 'ai',
        timestamp: new Date().toISOString(),
      }
    ]);
    setError(null);
  };

  const handleQuickPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const quickPrompts = [
    "Help me design inclusion criteria for a diabetes study",
    "What are the FDA requirements for Phase II trials?",
    "Suggest statistical methods for comparing two treatment groups",
    "How do I calculate sample size for a clinical trial?",
    "What are the key elements of an informed consent form?",
    "Explain the difference between primary and secondary endpoints",
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PsychologyIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1">
              AI Research Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Get help with clinical research, study design, and regulatory compliance
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={clearChat}
        >
          Clear Chat
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Prompts Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LightbulbIcon />
                Quick Start Prompts
              </Typography>
              <List dense>
                {quickPrompts.map((prompt, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                    onClick={() => handleQuickPrompt(prompt)}
                  >
                    <Typography variant="body2" color="primary">
                      {prompt}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeIcon />
                AI Capabilities
              </Typography>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Study Design</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption">
                    Help with protocol development, endpoint selection, and study design optimization.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Regulatory Guidance</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption">
                    FDA, EMA, and ICH-GCP compliance guidance and requirements.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">Statistical Analysis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="caption">
                    Sample size calculations, statistical test selection, and analysis planning.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
            {/* Messages Area */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              <List>
                {messages.map((message, index) => (
                  <React.Fragment key={message.id}>
                    <ListItem
                      sx={{
                        display: 'flex',
                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                        alignItems: 'flex-start',
                        py: 1,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          gap: 1,
                          maxWidth: '80%',
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                            width: 32,
                            height: 32,
                          }}
                        >
                          {message.sender === 'user' ? <PersonIcon /> : <PsychologyIcon />}
                        </Avatar>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                            color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                            border: message.sender === 'ai' ? '1px solid' : 'none',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                            {message.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 1,
                              opacity: 0.7,
                              textAlign: message.sender === 'user' ? 'right' : 'left',
                            }}
                          >
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </Typography>
                        </Paper>
                      </Box>
                    </ListItem>
                    {index < messages.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
                {loading && (
                  <ListItem sx={{ justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                        <PsychologyIcon />
                      </Avatar>
                      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2">AI is thinking...</Typography>
                      </Paper>
                    </Box>
                  </ListItem>
                )}
              </List>
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  variant="outlined"
                  placeholder="Ask me anything about clinical research..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || loading}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Press Enter to send, Shift+Enter for new line
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIChat;
