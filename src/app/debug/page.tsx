'use client'

import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, session, loading } = useAuth()
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(false)

  const testApiCall = async () => {
    setApiLoading(true)
    try {
      const response = await fetch('/api/debug')
      const data = await response.json()
      setApiResponse(data)
    } catch (error) {
      setApiResponse({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setApiLoading(false)
    }
  }

  useEffect(() => {
    testApiCall()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Frontend Auth State</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Authenticated:</strong> {user ? 'Yes' : 'No'}</p>
            {user && (
              <>
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
              </>
            )}
            {session && (
              <p><strong>Session Expires:</strong> {new Date(session.expires_at! * 1000).toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">API Auth State</h2>
          <div className="space-y-2">
            <button 
              onClick={testApiCall}
              disabled={apiLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {apiLoading ? 'Testing...' : 'Test API Call'}
            </button>
            {apiResponse && (
              <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 