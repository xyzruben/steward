'use client'

import { useRef } from 'react'

export function TestReceiptGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateTestReceipt = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 600

    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Set text properties
    ctx.fillStyle = 'black'
    ctx.font = '16px monospace'
    ctx.textAlign = 'center'

    // Draw receipt content
    const lines = [
      'STEWARD TEST STORE',
      '123 Main Street',
      'Test City, TC 12345',
      'Tel: (555) 123-4567',
      '',
      `Date: ${new Date().toLocaleDateString()}`,
      'Receipt #: TEST-001',
      '',
      'Test Item 1          $12.99',
      'Test Item 2          $8.50',
      'Test Item 3          $15.75',
      '',
      'Subtotal:            $37.24',
      'Tax:                 $2.98',
      'TOTAL:               $40.22',
      '',
      'Thank you for your purchase!'
    ]

    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, 50 + (index * 25))
    })

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'test-receipt.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    }, 'image/png')
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Test Receipt Generator
      </h3>
      
      <button
        onClick={generateTestReceipt}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 mb-4"
      >
        Generate Test Receipt Image
      </button>
      
      <canvas
        ref={canvasRef}
        className="border border-slate-300 dark:border-slate-600 rounded-md mx-auto block"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
        Click the button to generate a test receipt image for OCR testing
      </p>
    </div>
  )
} 