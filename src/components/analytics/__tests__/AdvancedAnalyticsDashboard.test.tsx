// Advanced Analytics Dashboard component tests
// See: Master System Guide - Testing and Quality Assurance, Component Testing

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedAnalyticsDashboard } from '../AdvancedAnalyticsDashboard';
import { useAuth } from '../../../context/AuthContext';

// Mock dependencies
jest.mock('../../../context/AuthContext');
jest.mock('../AdvancedAnalyticsFilters', () => ({
  AdvancedAnalyticsFilters: ({ onTypeChange, onPeriodChange, onFiltersChange }: any) => (
    <div data-testid="advanced-analytics-filters">
      <button onClick={() => onTypeChange('trends')}>Change to Trends</button>
      <button onClick={() => onPeriodChange('yearly')}>Change to Yearly</button>
      <button onClick={() => onFiltersChange({ dateRange: { start: new Date('2024-01-01'), end: new Date('2024-01-31') } })}>
        Apply Date Filter
      </button>
    </div>
  ),
}));

jest.mock('../AnalyticsChart', () => ({
  AnalyticsChart: ({ data, config, type }: any) => (
    <div data-testid="analytics-chart">
      <div data-testid="chart-type">{type}</div>
      <div data-testid="chart-config">{JSON.stringify(config)}</div>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

jest.mock('../AnalyticsExport', () => ({
  AnalyticsExport: ({ onExport, isLoading }: any) => (
    <button data-testid="export-button" onClick={onExport} disabled={isLoading}>
      {isLoading ? 'Exporting...' : 'Export CSV'}
    </button>
  ),
}));

jest.mock('../../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: any) => <div data-testid="loading-spinner" data-size={size}>Loading...</div>,
}));

jest.mock('../../ui/NotificationToast', () => ({
  NotificationToast: ({ message, type, onClose }: any) => (
    <div data-testid="notification-toast" data-type={type}>
      {message}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('AdvancedAnalyticsDashboard', () => {
  const mockUser = { id: 'test-user-id', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, signOut: jest.fn() });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: { totalSpent: 1000, receiptCount: 10, averageReceipt: 100 },
        metadata: { cached: false, queryTime: 50, timestamp: new Date().toISOString() },
      }),
    });
  });

  describe('Authentication', () => {
    it('should show login message when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ user: null, signOut: jest.fn() });

      render(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Please log in to view analytics')).toBeInTheDocument();
    });

    it('should render dashboard when user is authenticated', () => {
      render(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Deep insights into your spending patterns and trends')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    it('should render with default analytics type and period', () => {
      render(<AdvancedAnalyticsDashboard />);

      expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('advanced-analytics-filters')).toBeInTheDocument();
      expect(screen.getByTestId('export-button')).toBeInTheDocument();
    });

    it('should fetch initial analytics data on mount', async () => {
      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/advanced?type=overview&period=monthly')
        );
      });
    });
  });

  describe('Analytics Type Changes', () => {
    it('should change analytics type when filter component triggers change', async () => {
      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Change to trends
      fireEvent.click(screen.getByText('Change to Trends'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/advanced?type=trends&period=monthly')
        );
      });
    });

    it('should change period when filter component triggers change', async () => {
      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Change to yearly
      fireEvent.click(screen.getByText('Change to Yearly'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/advanced?type=overview&period=yearly')
        );
      });
    });
  });

  describe('Filtering', () => {
    it('should apply filters when filter component triggers change', async () => {
      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Apply date filter
      fireEvent.click(screen.getByText('Apply Date Filter'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('startDate=2024-01-01')
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('endDate=2024-01-31')
        );
      });
    });
  });

  describe('Data Fetching', () => {
    it('should show loading state while fetching data', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AdvancedAnalyticsDashboard />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show success notification when data loads successfully', async () => {
      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
        expect(screen.getByText(/Analytics data loaded successfully/)).toBeInTheDocument();
      });
    });

    it('should show error notification when data fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });
    });

    it('should show error state when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-toast')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should trigger export when export button is clicked', async () => {
      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Click export button
      fireEvent.click(screen.getByTestId('export-button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/analytics/advanced?type=export-data')
        );
      });
    });

    it('should show loading state during export', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Click export button
      fireEvent.click(screen.getByTestId('export-button'));

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    it('should show success notification when export completes', async () => {
      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Click export button
      fireEvent.click(screen.getByTestId('export-button'));

      await waitFor(() => {
        expect(screen.getByText('Analytics data exported successfully')).toBeInTheDocument();
      });
    });

    it('should show error notification when export fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Export error'));

      render(<AdvancedAnalyticsDashboard />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });

      // Click export button
      fireEvent.click(screen.getByTestId('export-button'));

      await waitFor(() => {
        expect(screen.getByText('Failed to export analytics data')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Rendering', () => {
    it('should render chart with correct data and configuration', async () => {
      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
        expect(screen.getByTestId('chart-type')).toHaveTextContent('overview');
      });
    });

    it('should show no data message when no data is available', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: null,
          metadata: { cached: false, queryTime: 0, timestamp: new Date().toISOString() },
        }),
      });

      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });

  describe('Metadata Display', () => {
    it('should display query time and cache status', async () => {
      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Query time: 50ms/)).toBeInTheDocument();
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });

    it('should indicate when data is cached', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: { totalSpent: 1000, receiptCount: 10, averageReceipt: 100 },
          metadata: { cached: true, queryTime: 5, timestamp: new Date().toISOString() },
        }),
      });

      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Query time: 5ms \(cached\)/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show retry button when there is an error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should retry data fetch when retry button is clicked', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<AdvancedAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Mock successful response for retry
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          data: { totalSpent: 1000, receiptCount: 10, averageReceipt: 100 },
          metadata: { cached: false, queryTime: 50, timestamp: new Date().toISOString() },
        }),
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByTestId('analytics-chart')).toBeInTheDocument();
      });
    });
  });
}); 