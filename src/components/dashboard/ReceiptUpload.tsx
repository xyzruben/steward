'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadResult {
  id: string
  imageUrl: string
  merchant: string
  total: number
  purchaseDate: string
  ocrConfidence: number
}

export function ReceiptUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [error, setError] = useState('')

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError('')
    setUploadResults([])

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const formData = new FormData()
        formData.append('receipt', file)

        const response = await fetch('/api/receipts/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const result = await response.json()
        setUploadResults(prev => [...prev, result.receipt])
        setUploadProgress(((i + 1) / acceptedFiles.length) * 100)
      }

      // Notify other components that receipts were uploaded
      window.dispatchEvent(new CustomEvent('receipt-uploaded'))

      // Show success for a few seconds
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
        setUploadResults([])
      }, 3000)
    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
      setUploading(false)
      setUploadProgress(0)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Upload Receipt
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        </div>
      )}

      {uploadResults.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Uploaded Receipts:
          </h3>
          {uploadResults.map((result, index) => (
            <div key={result.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {result.merchant}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    ${result.total.toFixed(2)} • OCR: {result.ocrConfidence.toFixed(1)}%
                  </p>
                </div>
                <div className="text-xs text-green-600 dark:text-green-300">
                  ✓
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Processing receipt... {Math.round(uploadProgress)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500">
              Extracting text with OCR...
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isDragActive
                  ? 'Drop the receipt here...'
                  : 'Drag & drop receipt images here, or click to select'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Supports JPEG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        Receipts will be automatically processed with OCR and AI categorization
      </div>
    </div>
  )
} 