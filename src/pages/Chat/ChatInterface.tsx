import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Clear as ClearIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { StudyService } from '@/services/studyService';
import { aiService, ChatMessage, ChatRequest } from '@/services/aiService';
import { Study } from '@/types';

const ChatInterface: React.FC = () => {
  const { id: studyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<Study | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [studyLoading, setStudyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (studyId) {
      fetchStudy(studyId);
      initializeChat(studyId);
    }
  }, [studyId]);

  const fetchStudy = async (id: string) => {
    try {
      setStudyLoading(true);
      const response = await StudyService.getStudy(id);
      if (response.success && response.data) {
        setStudy(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study');
    } finally {
      setStudyLoading(false);
    }
  };

  const initializeChat = (studyId: string) => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      message: `Hello! I'm your AI assistant for this study. I have context about your study and can help you with:

• Study protocol questions and clarifications
• Patient enrollment strategies and criteria
• Data collection and analysis guidance  
• Regulatory compliance questions
• Statistical planning and sample size calculations
• Timeline and milestone planning

What would you like to discuss about your study?`,
      sender: 'ai',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || loading || !studyId) return;

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
        studyId,
        context: {
          study,
          previousMessages: messages.slice(-5),
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
          message: `💡 **Suggested follow-up topics:**
${response.suggestions.map(s => `• ${s}`).join('\n')}`,
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
    if (studyId) {
      initializeChat(studyId);
    }
    setError(null);
  };

  const handleQuickPrompt = (prompt: string) => {
    setCurrentMessage(prompt);
  };

  const studySpecificPrompts = [
    "How can I improve patient enrollment for this study?",
    "What are the key regulatory considerations for this study type?",
    "Help me design inclusion/exclusion criteria",
    "What statistical tests should I use for this study design?",
    "How should I handle missing data in this study?",
    "What are the timeline risks for this study?",
  ];

  if (studyLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <SmartToyIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" component="h1">
                Study AI Assistant
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {study?.title || 'Study-specific Q&A and guidance'}
              </Typography>
            </Box>
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
        {/* Chat Interface */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                p: 2,
                overflowY: 'auto',
                backgroundColor: '#fafafa',
              }}
            >
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      alignItems: 'flex-start',
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main',
                        mx: 1,
                      }}
                    >
                      {message.sender === 'user' ? <PersonIcon /> : <PsychologyIcon />}
                    </Avatar>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: message.sender === 'user' ? 'primary.light' : 'white',
                        color: message.sender === 'user' ? 'white' : 'inherit',
                        maxWidth: '70%',
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {message.message}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
                {loading && (
                  <ListItem>
                    <Avatar sx={{ bgcolor: 'primary.main', mx: 1 }}>
                      <PsychologyIcon />
                    </Avatar>
                    <Paper sx={{ p: 2 }}>
                      <CircularProgress size={20} />
                    </Paper>
                  </ListItem>
                )}
              </List>
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Divider />
            <Box sx={{ p: 2, backgroundColor: 'white' }}>
              <Box display="flex" gap={1}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Ask me anything about your study..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <Button
                  variant="contained"
                  endIcon={<SendIcon />}
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || loading}
                  sx={{ minWidth: 'auto', px: 3 }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Study Context & Quick Prompts */}
        <Grid item xs={12} md={4}>
          {/* Study Context */}
          {study && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Study Context
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Title:</strong> {study.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Status:</strong> 
                  <Chip size="small" label={study.status} sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>PI:</strong> {study.principalInvestigator}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Enrollment:</strong> {study.currentEnrollment || 0} / {study.targetEnrollment}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Quick Prompts */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Start Prompts
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {studySpecificPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickPrompt(prompt)}
                    sx={{
                      textAlign: 'left',
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ChatInterface;
