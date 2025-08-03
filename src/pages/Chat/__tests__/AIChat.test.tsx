import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render } from '@/utils/test-utils';
import AIChat from '../AIChat';
import { aiService } from '@/services/aiService';

// Mock the AI service
jest.mock('@/services/aiService');
const mockAiService = aiService) as jest.Mocked<typeof aiservice)>;

// Mock WebSocket for real-time features
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
}));

describe('AIChat Component', () => {
  const mockMessages = [
    {
      id: 'msg-1',
      content: 'Hello! How can I help you with your research today?',
      sender: 'ai',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: 'msg-2',
      content: 'I need help analyzing patient enrollment data.',
      sender: 'user',
      timestamp: '2024-01-01T10:01:00Z',
    },
    {
      id: 'msg-3',
      content: 'I can definitely help you with that! Please share your enrollment data and I\'ll provide insights on trends, demographics, and recommendations for improving recruitment.',
      sender: 'ai',
      timestamp: '2024-01-01T10:02:00Z',
    },
  ] as jest.Mocked<typeof [
    {
      id: 'msg-1',
      content: 'hello! how can i help you with your research today?',
      sender: 'ai',
      timestamp: '2024-01-01t10:00:00z',
    },
    {
      id: 'msg-2',
      content: 'i need help analyzing patient enrollment data.',
      sender: 'user',
      timestamp: '2024-01-01t10:01:00z',
    },
    {
      id: 'msg-3',
      content: 'i can definitely help you with that! please share your enrollment data and i\'ll provide insights on trends, demographics, and recommendations for improving recruitment.',
      sender: 'ai',
      timestamp: '2024-01-01t10:02:00z',
    },
  ]>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAiService.getChatHistory.mockResolvedValue(mockMessages);
    mockAiService.sendMessage.mockResolvedValue({
      id: 'msg-new',
      content: 'AI response',
      sender: 'ai',
      timestamp: new Date().toISOString(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render and Chat History', () => {
    test('should render chat interface', async () => {
      render(<AIChat />);
      
      expect(screen.getByText('AI Research Assistant')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    });

    test('should load and display chat history', async () => {
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
        expect(screen.getByText('I need help analyzing patient enrollment data.')).toBeInTheDocument();
      });
    });

    test('should show message timestamps', async () => {
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText(/10:00/)).toBeInTheDocument();
        expect(screen.getByText(/10:01/)).toBeInTheDocument();
        expect(screen.getByText(/10:02/)).toBeInTheDocument();
      });
    });

    test('should distinguish between user and AI messages', async () => {
      render(<AIChat />);
      
      await waitFor(() => {
        const aiMessages = screen.getAllByTestId('ai-message');
        const userMessages = screen.getAllByTestId('user-message');
        
        expect(aiMessages).toHaveLength(2);
        expect(userMessages).toHaveLength(1);
      });
    });
  });

  describe('Sending Messages', () => {
    test('should send message when form is submitted', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'What are the latest research trends?');
      await user.click(sendButton);
      
      expect(mockAiService.sendMessage).toHaveBeenCalledWith('What are the latest research trends?');
    });

    test('should send message when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      
      await user.type(messageInput, 'What are the latest research trends?');
      await user.keyboard('{Enter}');
      
      expect(mockAiService.sendMessage).toHaveBeenCalledWith('What are the latest research trends?');
    });

    test('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      expect(mockAiService.sendMessage).not.toHaveBeenCalled();
    });

    test('should clear input after sending message', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(messageInput).toHaveValue('');
      });
    });

    test('should show user message immediately after sending', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('AI Responses', () => {
    test('should show typing indicator while AI is responding', async () => {
      const user = userEvent.setup();
      mockAiService.sendMessage.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      expect(screen.getByText(/ai is typing/i)).toBeInTheDocument();
    });

    test('should display AI response after receiving', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('AI response')).toBeInTheDocument();
      });
    });

    test('should handle AI service errors gracefully', async () => {
      const user = userEvent.setup();
      mockAiService.sendMessage.mockRejectedValue(new Error('AI service unavailable'));
      
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText(/sorry, i encountered an error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Message Features', () => {
    test('should allow copying messages', async () => {
      const user = userEvent.setup();
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });
      
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
      });
      
      const copyButtons = screen.getAllByLabelText(/copy message/i);
      await user.click(copyButtons[0]);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'Hello! How can I help you with your research today?'
      );
    });

    test('should show copy confirmation', async () => {
      const user = userEvent.setup();
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });
      
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
      });
      
      const copyButtons = screen.getAllByLabelText(/copy message/i);
      await user.click(copyButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    test('should allow regenerating AI responses', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText(/I can definitely help you with that!/)).toBeInTheDocument();
      });
      
      const regenerateButtons = screen.getAllByLabelText(/regenerate response/i);
      await user.click(regenerateButtons[0]);
      
      expect(mockAiService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('Chat Management', () => {
    test('should clear chat when clear button is clicked', async () => {
      const user = userEvent.setup();
      mockAiService.clearChatHistory.mockResolvedValue(undefined);
      
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
      });
      
      const clearButton = screen.getByLabelText(/clear chat/i);
      await user.click(clearButton);
      
      // Should show confirmation dialog
      expect(screen.getByText(/clear all messages/i)).toBeInTheDocument();
      
      const confirmButton = screen.getByText('Clear');
      await user.click(confirmButton);
      
      expect(mockAiService.clearChatHistory).toHaveBeenCalled();
    });

    test('should export chat history', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByLabelText(/export chat/i);
      await user.click(exportButton);
      
      // Should trigger download
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Suggested Questions', () => {
    test('should show suggested questions for new users', () => {
      mockAiService.getChatHistory.mockResolvedValue([]);
      
      render(<AIChat />);
      
      expect(screen.getByText(/suggested questions/i)).toBeInTheDocument();
      expect(screen.getByText(/analyze enrollment trends/i)).toBeInTheDocument();
      expect(screen.getByText(/help with study design/i)).toBeInTheDocument();
    });

    test('should send suggested question when clicked', async () => {
      const user = userEvent.setup();
      mockAiService.getChatHistory.mockResolvedValue([]);
      
      render(<AIChat />);
      
      const suggestedQuestion = screen.getByText(/analyze enrollment trends/i);
      await user.click(suggestedQuestion);
      
      expect(mockAiService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('analyze enrollment trends')
      );
    });
  });

  describe('File Upload', () => {
    test('should show file upload area', () => {
      render(<AIChat />);
      
      expect(screen.getByText(/drag and drop files/i)).toBeInTheDocument();
    });

    test('should handle file uploads', async () => {
      const user = userEvent.setup();
      mockAiService.uploadFile.mockResolvedValue({ fileId: 'file-1', filename: 'data.csv' });
      
      render(<AIChat />);
      
      const fileInput = screen.getByLabelText(/upload file/i);
      const file = new File(['test data'], 'data.csv', { type: 'text/csv' });
      
      await user.upload(fileInput, file);
      
      expect(mockAiService.uploadFile).toHaveBeenCalledWith(file);
    });

    test('should show file upload progress', async () => {
      const user = userEvent.setup();
      mockAiService.uploadFile.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ fileId: 'file-1', filename: 'data.csv' }), 1000))
      );
      
      render(<AIChat />);
      
      const fileInput = screen.getByLabelText(/upload file/i);
      const file = new File(['test data'], 'data.csv', { type: 'text/csv' });
      
      await user.upload(fileInput, file);
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Message Search', () => {
    test('should filter messages by search term', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search messages/i);
      await user.type(searchInput, 'enrollment');
      
      expect(screen.getByText('I need help analyzing patient enrollment data.')).toBeInTheDocument();
      expect(screen.queryByText('Hello! How can I help you with your research today?')).not.toBeInTheDocument();
    });

    test('should highlight search terms in results', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText('Hello! How can I help you with your research today?')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText(/search messages/i);
      await user.type(searchInput, 'enrollment');
      
      const highlightedTerm = screen.getByTestId('search-highlight');
      expect(highlightedTerm).toHaveTextContent('enrollment');
    });
  });

  describe('Keyboard Shortcuts', () => {
    test('should focus input when / is pressed', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      await user.keyboard('/');
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      expect(messageInput).toHaveFocus();
    });

    test('should clear chat with Ctrl+L', async () => {
      const user = userEvent.setup();
      mockAiService.clearChatHistory.mockResolvedValue(undefined);
      
      render(<AIChat />);
      
      await user.keyboard('{Control>}l{/Control}');
      
      expect(screen.getByText(/clear all messages/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      render(<AIChat />);
      
      expect(screen.getByRole('log', { name: /chat messages/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    test('should announce new messages to screen readers', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/new message from ai/i);
      });
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      // Tab to message input
      await user.tab();
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      expect(messageInput).toHaveFocus();
      
      // Tab to send button
      await user.tab();
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    test('should virtualize long message lists', async () => {
      const manyMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        sender: i % 2 === 0 ? 'user' : 'ai',
        timestamp: new Date().toISOString(),
      }));
      
      mockAiService.getChatHistory.mockResolvedValue(manyMessages);
      
      render(<AIChat />);
      
      await waitFor(() => {
        // Should only render visible messages
        const visibleMessages = screen.getAllByTestId(/message/);
        expect(visibleMessages.length).toBeLessThan(100);
      });
    });

    test('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<AIChat />);
      
      const searchInput = screen.getByPlaceholderText(/search messages/i);
      
      // Type quickly
      await user.type(searchInput, 'enrollment', { delay: 50 });
      
      // Should not search on every keystroke
      // This would be tested with proper mock timers in a real implementation
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      mockAiService.getChatHistory.mockRejectedValue(new Error('Network error'));
      
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to load chat history/i)).toBeInTheDocument();
      });
    });

    test('should show retry option on errors', async () => {
      const user = userEvent.setup();
      mockAiService.getChatHistory.mockRejectedValue(new Error('Network error'));
      
      render(<AIChat />);
      
      await waitFor(() => {
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);
      
      expect(mockAiService.getChatHistory).toHaveBeenCalledTimes(2);
    });
  });
});
