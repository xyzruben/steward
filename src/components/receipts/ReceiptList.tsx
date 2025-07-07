'use client'

import React from 'react'
import { Receipt } from '@/generated/prisma'

interface ReceiptListProps {
  receipts: Receipt[]
  selectedReceipts: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onReceiptClick?: (receipt: Receipt) => void
}

export function ReceiptList({
  receipts,
  selectedReceipts,
  onSelectionChange,
  onReceiptClick
}: ReceiptListProps) {
  const handleSelectReceipt = (receiptId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (selectedReceipts.includes(receiptId)) {
      onSelectionChange(selectedReceipts.filter(id => id !== receiptId))
    } else {
      onSelectionChange([...selectedReceipts, receiptId])
    }
  }

  const handleReceiptClick = (receipt: Receipt) => {
    if (onReceiptClick) {
      onReceiptClick(receipt)
    }
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          No receipts found. Upload your first receipt to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => (
        <div
          key={receipt.id}
          onClick={() => handleReceiptClick(receipt)}
          className={`
            flex items-center space-x-4 p-4 border rounded-lg transition-colors duration-200 cursor-pointer
            ${selectedReceipts.includes(receipt.id)
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }
          `}
        >
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={selectedReceipts.includes(receipt.id)}
            onChange={() => {}} // Handled by onClick to prevent double-triggering
            onClick={(e) => handleSelectReceipt(receipt.id, e)}
            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
          />

          {/* Receipt icon */}
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          
          {/* Receipt details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {receipt.merchant}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(receipt.purchaseDate).toLocaleDateString()}
                </p>
                {receipt.category && (
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                      {receipt.category}
                    </span>
                    {receipt.subcategory && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {receipt.subcategory}
                      </span>
                    )}
                  </div>
                )}
                {receipt.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {receipt.summary}
                  </p>
                )}
              </div>
              
              <div className="text-right ml-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  ${Number(receipt.total).toFixed(2)}
                </p>
                {receipt.confidenceScore && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {Math.round(Number(receipt.confidenceScore) * 100)}% confidence
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 