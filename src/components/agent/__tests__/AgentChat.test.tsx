import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AgentChat from '../AgentChat';

// Mock fetch globally
beforeAll(() => {
  global.fetch = jest.fn();
});
afterAll(() => {
  (global.fetch as jest.Mock).mockRestore();
});
afterEach(() => {
  jest.clearAllMocks();
});

describe('AgentChat', () => {
  it('renders input and button', () => {
    render(<AgentChat />);
    expect(screen.getByPlaceholderText(/ask anything/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ask/i })).toBeInTheDocument();
    expect(screen.getByText(/💬 Financial Assistant/i)).toBeInTheDocument();
  });

  it('shows loading state and displays agent response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Test response', 
        data: { foo: 'bar' },
        insights: ['Key insight 1', 'Key insight 2']
      }),
    });
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'How much?' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();
    await waitFor(() => expect(screen.getByText(/💡 Analysis/i)).toBeInTheDocument());
    expect(screen.getByText(/test response/i)).toBeInTheDocument();
    expect(screen.getByText(/foo/)).toBeInTheDocument();
  });

  it('displays insights when provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'Analysis complete', 
        data: null,
        insights: ['Spending increased by 15%', 'Top category: Food & Dining']
      }),
    });
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'Analyze my spending' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    
    await waitFor(() => expect(screen.getByText(/🔍 Key Insights/i)).toBeInTheDocument());
    expect(screen.getByText(/Spending increased by 15%/)).toBeInTheDocument();
    expect(screen.getByText(/Top category: Food & Dining/)).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'fail' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });

  it('shows error state on API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'API error message' }),
    });
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    await waitFor(() => expect(screen.getByText(/API error message/i)).toBeInTheDocument());
  });

  it('handles empty insights gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        message: 'No insights available', 
        data: null,
        insights: []
      }),
    });
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    
    await waitFor(() => expect(screen.getByText(/💡 Analysis/i)).toBeInTheDocument());
    expect(screen.getByText(/no insights available/i)).toBeInTheDocument();
    // Should not show insights section when empty
    expect(screen.queryByText(/🔍 Key Insights/i)).not.toBeInTheDocument();
  });
}); 