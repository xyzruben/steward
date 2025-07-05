'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileImage, AlertCircle, Info } from 'lucide-react'

// ============================================================================
// RECEIPT UPLOAD COMPONENT
// ============================================================================
// Handles drag-and-drop receipt upload with format validation and progress tracking
// Follows STEWARD_MASTER_SYSTEM_GUIDE.md sections: Component Hierarchy, 
// React State Patterns, Input Validation, and Accessibility

/**
 * Interface for upload result data
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - API Response Typing
 */
interface UploadResult {
  id: string
  imageUrl: string
  merchant: string
  total: number
  purchaseDate: string
  ocrConfidence: number
}

interface ReceiptUploadProps {
  onUploadSuccess: () => void
}

/**
 * ReceiptUpload component for handling receipt image uploads
 * Supports multiple formats including iPhone HEIC/HEIF files
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy, Input Validation
 */
export default function ReceiptUpload({ onUploadSuccess }: ReceiptUploadProps) {
  // ============================================================================
  // STATE MANAGEMENT (see master guide: React State Patterns)
  // ============================================================================
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])

  // ============================================================================
  // FILE UPLOAD HANDLER (see master guide: Data Fetching Patterns, Error Handling)
  // ============================================================================
  const handleFileUpload = async (file: File) => {
    setIsUploading(true)
    setUploadStatus('idle')
    setErrorMessage('')

    // Check file type and provide guidance
    const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')
    if (isHeic) {
      setErrorMessage(
        'HEIC files are not supported. Please convert your receipt to JPEG or PNG format before uploading. ' +
        'You can use your phone\'s camera app to save as JPEG, or use online converters.'
      )
      setUploadStatus('error')
      setIsUploading(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload successful:', result)
      setUploadStatus('success')
      onUploadSuccess()
      setUploadResults(prev => [...prev, result.receipt])
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed')
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  // ============================================================================
  // DROPZONE CONFIGURATION (see master guide: Input Validation)
  // ============================================================================
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0])
      }
    },
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    multiple: false,
    // Accessibility improvements (see master guide: Internationalization and Accessibility)
    disabled: isUploading
  })

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Receipt
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Upload a receipt image to automatically extract and categorize expenses
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* File Format Guidance */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Supported formats: JPEG, PNG. HEIC files need to be converted to JPEG first.
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop your receipt here, or click to browse
          </p>
          <p className="text-xs text-gray-500 mb-4">
            JPEG, PNG • Max 10MB
          </p>
          <button
            type="button"
            disabled={isUploading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Choose File'}
          </button>
        </div>

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="h-4 w-4 bg-green-600 rounded-full mt-0.5 flex-shrink-0"></div>
            <p className="text-sm text-green-800">
              Receipt uploaded successfully! Processing your data...
            </p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 