/**
 * @file LoginForm.test.tsx
 * @description Unit tests for LoginForm component
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Testing, Unit Testing Strategy
 */

import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../LoginForm'

// Mock the AuthContext
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockResendConfirmation = jest.fn()

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    resendConfirmation: mockResendConfirmation,
  }),
}))

describe('LoginForm', () => {
  // Helper function to find the toggle button
  const getToggleButton = () =>
    screen.getByText("Don&apos;t have an account? Sign Up");

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render login form by default', () => {
      render(<LoginForm />)

      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
      expect(screen.getByText(/Don't have an account\? Sign Up/)).toBeInTheDocument()
    })

    it('should render sign up form when toggled', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
      expect(screen.getByText('Already have an account? Sign In')).toBeInTheDocument()
    })

    it('should have proper form labels and placeholders', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'Enter your email')
      expect(emailInput).toBeRequired()

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter your password')
      expect(passwordInput).toBeRequired()
    })
  })

  describe('Form Validation', () => {
    it('should require email and password fields', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      await user.click(submitButton)

      // HTML5 validation should prevent submission
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'invalid-email')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      // HTML5 validation should prevent submission with invalid email
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })

  describe('Sign In Flow', () => {
    it('should handle successful sign in', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ error: null })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    it('should handle sign in error', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ 
        error: { message: 'Invalid credentials' } 
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
    })

    it('should handle email not confirmed error', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ 
        error: { message: 'Email not confirmed' } 
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Please check your email and click the confirmation link/)).toBeInTheDocument()
        expect(screen.getByText('Resend confirmation email')).toBeInTheDocument()
      })
    })

    it('should show loading state during sign in', async () => {
      const user = userEvent.setup()
      mockSignIn.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Sign Up Flow', () => {
    it('should handle successful sign up', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValueOnce({ 
        error: null, 
        success: true 
      })

      render(<LoginForm />)

      // Switch to sign up mode
      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(submitButton)

      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'newpassword123')

      await waitFor(() => {
        expect(screen.getByText(/Account created! Please check your email/)).toBeInTheDocument()
        expect(screen.getByText('Resend confirmation email')).toBeInTheDocument()
      })
    })

    it('should handle sign up error', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValueOnce({ 
        error: { message: 'Email already exists' } 
      })

      render(<LoginForm />)

      // Switch to sign up mode
      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'existing@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument()
      })
    })

    it('should clear form after successful sign up', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValueOnce({ 
        error: null, 
        success: true 
      })

      render(<LoginForm />)

      // Switch to sign up mode
      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveValue('')
        expect(passwordInput).toHaveValue('')
      })
    })
  })

  describe('Resend Confirmation', () => {
    it('should show resend confirmation option when needed', async () => {
      const user = userEvent.setup()
      mockSignUp.mockResolvedValueOnce({ 
        error: null, 
        success: true 
      })

      render(<LoginForm />)

      // Switch to sign up mode and complete sign up
      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Resend confirmation email')).toBeInTheDocument()
      })
    })

    it('should handle resend confirmation success', async () => {
      const user = userEvent.setup()
      mockResendConfirmation.mockResolvedValueOnce({ error: null })

      render(<LoginForm />)

      // First trigger the resend option by doing a sign up
      mockSignUp.mockResolvedValueOnce({ 
        error: null, 
        success: true 
      })

      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Resend confirmation email')).toBeInTheDocument()
      })

      // Now test resend functionality
      const resendButton = screen.getByText('Resend confirmation email')
      await user.click(resendButton)

      expect(mockResendConfirmation).toHaveBeenCalledWith('newuser@example.com')

      await waitFor(() => {
        expect(screen.getByText(/Confirmation email sent! Please check your inbox/)).toBeInTheDocument()
      })
    })

    it('should handle resend confirmation error', async () => {
      const user = userEvent.setup()
      mockResendConfirmation.mockResolvedValueOnce({ 
        error: { message: 'Failed to send email' } 
      })

      render(<LoginForm />)

      // First trigger the resend option
      mockSignUp.mockResolvedValueOnce({ 
        error: null, 
        success: true 
      })

      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign Up' })

      await user.type(emailInput, 'newuser@example.com')
      await user.type(passwordInput, 'newpassword123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Resend confirmation email')).toBeInTheDocument()
      })

      const resendButton = screen.getByText('Resend confirmation email')
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to send email')).toBeInTheDocument()
      })
    })

    it('should require email for resend confirmation', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      // Try to resend without email
      const resendButton = screen.getByText('Resend confirmation email')
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText('Please enter your email address first')).toBeInTheDocument()
      })
    })
  })

  describe('Form State Management', () => {
    it('should clear form when switching between modes', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      // Fill form in sign in mode
      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')

      // Switch to sign up mode
      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      // Form should be cleared
      expect(emailInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')

      // Fill form in sign up mode
      await user.type(emailInput, 'new@example.com')
      await user.type(passwordInput, 'newpassword')

      // Switch back to sign in mode
      const toggleBackButton = screen.getByText('Already have an account? Sign In')
      await user.click(toggleBackButton)

      // Form should be cleared again
      expect(emailInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')
    })

    it('should clear error messages when switching modes', async () => {
      const user = userEvent.setup()
      mockSignIn.mockResolvedValueOnce({ 
        error: { message: 'Invalid credentials' } 
      })

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Switch modes
      const toggleButton = getToggleButton()
      await user.click(toggleButton)

      // Error should be cleared
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const user = userEvent.setup()
      mockSignIn.mockRejectedValueOnce(new Error('Network error'))

      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels and associations', () => {
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Email')
      const passwordInput = screen.getByLabelText('Password')

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('should have proper button types and roles', () => {
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: 'Sign In' })
      expect(submitButton).toHaveAttribute('type', 'submit')

      const toggleButton = screen.getByRole('button', {
        name: "Don&apos;t have an account? Sign Up",
      })
      expect(toggleButton).toHaveAttribute('type', 'button')
    })
  })
}) 