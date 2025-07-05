'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showResend, setShowResend] = useState(false)
  
  const { signIn, signUp, resendConfirmation } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (isSignUp) {
        const { error, success: signUpSuccess } = await signUp(email, password)
        
        if (error) {
          setError(error.message)
        } else if (signUpSuccess) {
          setSuccess('Account created! Please check your email to confirm your account.')
          setShowResend(true)
          setEmail('')
          setPassword('')
        }
      } else {
        const { error } = await signIn(email, password)
        
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.')
            setShowResend(true)
          } else {
            setError(error.message)
          }
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await resendConfirmation(email)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Confirmation email sent! Please check your inbox.')
      }
    } catch {
      setError('Failed to send confirmation email')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
    setShowResend(false)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 dark:text-green-400 text-sm">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
        >
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>

      {showResend && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            Didn&apos;t receive the confirmation email?
          </p>
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={loading}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            {loading ? 'Sending...' : 'Resend confirmation email'}
          </button>
        </div>
      )}

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don&apos;t have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
} 