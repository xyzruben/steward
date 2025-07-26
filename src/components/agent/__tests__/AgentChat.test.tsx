import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentChat from '../AgentChat';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock clipboard API
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Helper function to create a mock streaming response
const createMockStreamingResponse = (data: any) => {
  const mockReader = {
    read: jest.fn().mockResolvedValue({
      done: false,
      value: new TextEncoder().encode(JSON.stringify(data) + '\n')
    }).mockResolvedValueOnce({
      done: false,
      value: new TextEncoder().encode(JSON.stringify(data) + '\n')
    }).mockResolvedValueOnce({
      done: true,
      value: new Uint8Array()
    })
  };

  return {
    ok: true,
    body: {
      getReader: jest.fn().mockReturnValue(mockReader)
    }
  };
};

describe('AgentChat - Enhanced UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockWriteText.mockClear();
  });

  describe('Chat Interface', () => {
    it('renders welcome message when no chat history', () => {
      render(<AgentChat />);
      
      expect(screen.getByText('Welcome to Steward AI')).toBeInTheDocument();
      expect(screen.getByText('Ask me anything about your spending patterns, trends, and financial insights.')).toBeInTheDocument();
      expect(screen.getByText('Try asking:')).toBeInTheDocument();
    });

    it('renders chat input and send button', () => {
      render(<AgentChat />);
      
      expect(screen.getByPlaceholderText(/Ask about your spending patterns/)).toBeInTheDocument();
      expect(screen.getByLabelText('Send')).toBeInTheDocument();
    });

    it('disables send button when input is empty', () => {
      render(<AgentChat />);
      
      const sendButton = screen.getByLabelText('Send');
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when input has content', async () => {
      const user = userEvent.setup();
      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend on food?');
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Chat History', () => {
    it('adds user message to chat history when submitted', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50 },
        insights: ['You spent $150.50 on food'],
        cached: false,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend on food?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('How much did I spend on food?')).toBeInTheDocument();
      });
    });

    it('displays assistant response with insights', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50 },
        insights: ['You spent $150.50 on food'],
        cached: false,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend on food?');
      await user.click(sendButton);

      // Wait for the response to be displayed
      await waitFor(() => {
        expect(screen.getByText('Analysis complete')).toBeInTheDocument();
        expect(screen.getByText('You spent $150.50 on food')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays error messages in chat history', async () => {
      const user = userEvent.setup();
      
      // Mock error streaming response
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'error',
        error: 'Database connection failed',
        message: 'An error occurred'
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      // Wait for the error to be displayed
      await waitFor(() => {
        expect(screen.getByText('Error: Database connection failed')).toBeInTheDocument();
      });
    });
  });

  describe('Message Formatting', () => {
    it('displays user messages with correct styling', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50 },
        insights: ['You spent $150.50 on food'],
        cached: false,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'Test message');
      await user.click(sendButton);

      await waitFor(() => {
        const userMessage = screen.getByText('Test message');
        // Check the parent div that contains the bg-blue-500 class
        const messageContainer = userMessage.closest('div[class*="bg-blue-500"]');
        expect(messageContainer).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays assistant messages with performance stats', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response with cached data
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50 },
        insights: ['You spent $150.50 on food'],
        cached: true,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      // Wait for the response and performance stats to be displayed
      await waitFor(() => {
        expect(screen.getByText('Analysis complete')).toBeInTheDocument();
        expect(screen.getByText('Cached')).toBeInTheDocument();
        expect(screen.getByText('1200ms')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Control Buttons', () => {
    it('renders all control buttons', () => {
      render(<AgentChat />);
      
      expect(screen.getByText('Streaming ON')).toBeInTheDocument();
      expect(screen.getByText('Clear Cache')).toBeInTheDocument();
      expect(screen.getByText('Clear Chat')).toBeInTheDocument();
    });

    it('toggles streaming mode', async () => {
      const user = userEvent.setup();
      render(<AgentChat />);
      
      const streamingButton = screen.getByText('Streaming ON');
      await user.click(streamingButton);
      
      expect(screen.getByText('Streaming OFF')).toBeInTheDocument();
    });

    it('clears chat history', async () => {
      const user = userEvent.setup();
      render(<AgentChat />);
      
      const clearButton = screen.getByText('Clear Chat');
      await user.click(clearButton);
      
      // Should show welcome message after clearing
      expect(screen.getByText('Welcome to Steward AI')).toBeInTheDocument();
    });

    it('shows export button when chat has history', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50 },
        insights: ['You spent $150.50 on food'],
        cached: false,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Interface', () => {
    it('renders chat and data tabs', () => {
      render(<AgentChat />);
      
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Data Panel')).toBeInTheDocument();
    });

    it('switches between chat and data tabs', async () => {
      const user = userEvent.setup();
      render(<AgentChat />);
      
      const dataTab = screen.getByText('Data Panel');
      await user.click(dataTab);
      
      expect(screen.getByText('Data Analysis')).toBeInTheDocument();
    });
  });

  describe('Data Panel', () => {
    it('shows performance statistics when available', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50 },
        insights: ['You spent $150.50 on food'],
        cached: true,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      // Submit a query first to trigger performance stats
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      // Wait for the response to be processed
      await waitFor(() => {
        expect(screen.getByText('Analysis complete')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Switch to data tab
      const dataTab = screen.getByText('Data Panel');
      await user.click(dataTab);

      // Wait for performance stats to be displayed
      await waitFor(() => {
        expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
        expect(screen.getByText('Cached')).toBeInTheDocument();
        expect(screen.getByText('1200ms')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows chat statistics', async () => {
      const user = userEvent.setup();
      render(<AgentChat />);
      
      // Switch to data tab
      const dataTab = screen.getByText('Data Panel');
      await user.click(dataTab);
      
      expect(screen.getByText('Chat Statistics')).toBeInTheDocument();
      expect(screen.getByText('Questions')).toBeInTheDocument();
      expect(screen.getByText('Responses')).toBeInTheDocument();
      expect(screen.getByText('With Insights')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('shows data action buttons for assistant messages', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response with data
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50, details: 'Some detailed data' },
        insights: ['You spent $150.50 on food'],
        cached: false,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      // Wait for the response and action buttons to be displayed
      await waitFor(() => {
        expect(screen.getByText('Analysis complete')).toBeInTheDocument();
        expect(screen.getByText('Show Data')).toBeInTheDocument();
        expect(screen.getByText('Copy Data')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('copies data to clipboard', async () => {
      const user = userEvent.setup();
      
      // Mock streaming response with data
      mockFetch.mockResolvedValueOnce(createMockStreamingResponse({
        type: 'complete',
        message: 'Analysis complete',
        data: { total: 150.50, details: 'Some detailed data' },
        insights: ['You spent $150.50 on food'],
        cached: false,
        executionTime: 1200
      }));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      // Wait for the response and copy button to be displayed, then click it
      await waitFor(async () => {
        expect(screen.getByText('Analysis complete')).toBeInTheDocument();
        const copyButton = screen.getByText('Copy Data');
        expect(copyButton).toBeInTheDocument();
        await user.click(copyButton);
      }, { timeout: 3000 });

      // Wait for clipboard to be called - give it more time for async operation
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(JSON.stringify({ total: 150.50, details: 'Some detailed data' }, null, 2));
      }, { timeout: 2000 });
    });

    it('copies data to clipboard with manual message', async () => {
      const user = userEvent.setup();
      
      // Mock a simple fetch response that doesn't use streaming
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: 'Analysis complete',
          data: { total: 150.50, details: 'Some detailed data' },
          insights: ['You spent $150.50 on food'],
          cached: false,
          executionTime: 1200
        })
      });

      render(<AgentChat />);
      
      // Disable streaming to use regular query
      const streamingButton = screen.getByText('Streaming ON');
      await user.click(streamingButton);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      // Check if fetch was called
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/agent/query', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'How much did I spend?', streaming: false })
        }));
      }, { timeout: 3000 });

      // Wait for the response and copy button to be displayed, then click it
      await waitFor(async () => {
        expect(screen.getByText('Analysis complete')).toBeInTheDocument();
        const copyButton = screen.getByText('Copy Data');
        expect(copyButton).toBeInTheDocument();
        await user.click(copyButton);
      }, { timeout: 3000 });

      // Wait for clipboard to be called
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(JSON.stringify({ total: 150.50, details: 'Some detailed data' }, null, 2));
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      render(<AgentChat />);
      
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      const sendButton = screen.getByLabelText('Send');
      
      await user.type(input, 'How much did I spend?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Error: HTTP error! status: 500')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<AgentChat />);
      
      expect(screen.getByLabelText('Send')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Chat' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Data Panel' })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<AgentChat />);
      
      // Tab to the first focusable element (should be the streaming button)
      await user.tab();
      
      // Tab to the input field (second tab)
      await user.tab();
      const input = screen.getByPlaceholderText(/Ask about your spending patterns/);
      expect(input).toHaveFocus();
      
      await user.type(input, 'Test query');
      
      // Tab to send button and press Enter
      await user.tab();
      const sendButton = screen.getByLabelText('Send');
      expect(sendButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
    });
  });
}); 