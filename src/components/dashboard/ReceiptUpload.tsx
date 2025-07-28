// ============================================================================
// ENHANCED RECEIPT UPLOAD COMPONENT (see STEWARD_MASTER_SYSTEM_GUIDE.md - Component Hierarchy)
// ============================================================================
// Premium receipt upload with advanced loading states and skeleton screens
// Follows master guide: Component Hierarchy, React State Patterns, Accessibility

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AnimatedButton, AnimatedCard } from '@/components/ui/AnimatedComponents'
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  fadeInUp, 
  scaleIn, 
  hoverScale, 
  staggerContainer, 
  staggerItem,
  slideInUp 
} from '@/lib/animations'

// ============================================================================
// TYPES AND INTERFACES (see master guide: TypeScript Standards)
// ============================================================================

interface ReceiptUploadProps {
  className?: string
  onUploadComplete?: (receipt: any) => void
}

interface UploadState {
  isUploading: boolean
  progress: number
  stage: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error'
  fileName?: string
  fileSize?: number
  error?: string
  showPreview: boolean
  isDragOver: boolean
}

// ============================================================================
// UPLOAD STAGES CONFIGURATION (see master guide: Component Hierarchy)
// ============================================================================

const UPLOAD_STAGES = [
  { id: 'uploading', label: 'Uploading file...', icon: Upload },
  { id: 'processing', label: 'Processing image...', icon: FileText },
  { id: 'analyzing', label: 'Analyzing receipt...', icon: FileText },
  { id: 'complete', label: 'Upload complete!', icon: CheckCircle }
]

// ============================================================================
// MAIN RECEIPT UPLOAD COMPONENT (see master guide: Component Hierarchy)
// ============================================================================

export function ReceiptUpload({ className = '', onUploadComplete }: ReceiptUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    stage: 'idle',
    showPreview: false,
    isDragOver: false
  })

  // ============================================================================
  // FILE HANDLING FUNCTIONS (see master guide: React State Patterns)
  // ============================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        stage: 'error',
        error: 'Only images are allowed'
      }))
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setUploadState(prev => ({
        ...prev,
        stage: 'error',
        error: 'File size too large'
      }))
      return
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      progress: 0,
      stage: 'uploading',
      fileName: file.name,
      fileSize: file.size,
      error: undefined
    }))

    // Perform real upload
    await performRealUpload(file)
  }, [onUploadComplete])

  const performRealUpload = async (file: File) => {
    try {
      // Stage 1: Uploading
      setUploadState(prev => ({ ...prev, stage: 'uploading', progress: 0 }))
      
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // Stage 2: Processing
        setUploadState(prev => ({ ...prev, stage: 'processing', progress: 50 }))
        
        // Stage 3: Analyzing
        setUploadState(prev => ({ ...prev, stage: 'analyzing', progress: 75 }))
        
        // Stage 4: Complete
        setUploadState(prev => ({ 
          ...prev, 
          stage: 'complete', 
          progress: 100,
          isUploading: false 
        }))

        // Call callback if provided
        if (onUploadComplete && result.receipt) {
          onUploadComplete(result.receipt)
        }

        // Reset after 3 seconds
        setTimeout(() => {
          setUploadState({
            isUploading: false,
            progress: 0,
            stage: 'idle',
            showPreview: false,
            isDragOver: false
          })
        }, 3000)

      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploadState(prev => ({
        ...prev,
        stage: 'error',
        error: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        isUploading: false
      }))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragOver: false }))
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragOver: true }))
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState(prev => ({ ...prev, isDragOver: false }))
  }, [])

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      stage: 'idle',
      showPreview: false,
      isDragOver: false
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      // Trigger change event to clear files
      const event = new Event('change', { bubbles: true })
      fileInputRef.current.dispatchEvent(event)
    }
  }, [])

  // ============================================================================
  // RENDER FUNCTIONS (see master guide: Component Hierarchy)
  // ============================================================================

  const renderUploadArea = () => {
    if (uploadState.stage === 'error') {
      return (
        <motion.div 
          className="text-center space-y-4"
          variants={scaleIn}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            role="alert"
            aria-live="polite"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Upload Failed
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {uploadState.error}
            </p>
            <AnimatedButton onClick={resetUpload} variant="outline">
              Try Again
            </AnimatedButton>
          </motion.div>
        </motion.div>
      )
    }

    if (uploadState.stage === 'complete') {
      return (
        <motion.div 
          className="text-center space-y-4"
          variants={scaleIn}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            role="alert"
            aria-live="polite"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Upload Complete!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Your receipt has been successfully processed
            </p>
          </motion.div>
        </motion.div>
      )
    }

    if (uploadState.isUploading) {
      const currentStage = UPLOAD_STAGES.find(stage => stage.id === uploadState.stage)
      const StageIcon = currentStage?.icon || Upload

      return (
        <motion.div 
          className="text-center space-y-6"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <StageIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </motion.div>
            </div>
            <motion.div 
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 500 }}
            >
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            role="alert"
            aria-live="polite"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {currentStage?.label || 'Processing...'}
            </h3>
            
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <motion.div 
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadState.progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {uploadState.progress}% complete
            </p>
          </motion.div>

          {uploadState.fileName && (
            <motion.div 
              className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {uploadState.fileName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {(uploadState.fileSize! / 1024 / 1024).toFixed(2)} MB
              </p>
            </motion.div>
          )}
        </motion.div>
      )
    }

    return (
      <motion.div
        data-testid="upload-dropzone"
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 relative',
          'border-slate-300 dark:border-slate-600',
          'hover:border-blue-400 dark:hover:border-blue-500',
          'hover:bg-blue-50 dark:hover:bg-blue-950/10',
          uploadState.isDragOver && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        variants={hoverScale}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
      >
        {/* Drag Overlay */}
        {uploadState.isDragOver && (
          <motion.div
            className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 rounded-lg flex items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-blue-600">Drop here</p>
            </div>
          </motion.div>
        )}
        <motion.div 
          className="space-y-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div 
            className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center"
            variants={staggerItem}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </motion.div>
          
          <motion.div variants={staggerItem}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Upload Receipt
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Drag and drop your receipt image here, or click to browse
            </p>
            
            <label htmlFor="receipt-upload">
              <AnimatedButton 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto"
                role="button"
              >
                Choose File
              </AnimatedButton>
            </label>
          </motion.div>
          
          <motion.p 
            className="text-xs text-slate-500 dark:text-slate-400"
            variants={staggerItem}
          >
            Supports JPEG, PNG, WebP, HEIC • Max 10MB
          </motion.p>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
              Upload Receipt
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {uploadState.isUploading 
                ? 'Processing your receipt...' 
                : 'Add a new receipt to your collection'
              }
            </p>
          </div>
          
          {uploadState.isUploading && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Processing
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {renderUploadArea()}
        {/* Visually hidden label for accessibility and test compatibility */}
        <label htmlFor="receipt-upload" className="sr-only">Upload Receipt</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
          className="hidden"
          id="receipt-upload"
        />
      </CardContent>
    </Card>
  )
} 