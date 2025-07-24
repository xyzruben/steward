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
  });

  it('shows loading state and displays agent response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Test response', data: { foo: 'bar' } }),
    });
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'How much?' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    expect(screen.getByRole('button', { name: /asking/i })).toBeDisabled();
    await waitFor(() => expect(screen.getByText(/agent:/i)).toBeInTheDocument());
    expect(screen.getByText(/test response/i)).toBeInTheDocument();
    expect(screen.getByText(/foo/)).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    render(<AgentChat />);
    fireEvent.change(screen.getByPlaceholderText(/ask anything/i), { target: { value: 'fail' } });
    fireEvent.click(screen.getByRole('button', { name: /ask/i }));
    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });
}); 