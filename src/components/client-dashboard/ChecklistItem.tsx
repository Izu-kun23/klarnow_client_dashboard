'use client'

import { useState } from 'react'

interface ChecklistItemProps {
  label: string
  isDone: boolean
  phaseId: string
  onToggle: (phaseId: string, label: string, isDone: boolean) => Promise<void>
  updating?: boolean
}

export default function ChecklistItem({
  label,
  isDone,
  phaseId,
  onToggle,
  updating = false
}: ChecklistItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleClick = async () => {
    if (isUpdating || updating) return

    setIsUpdating(true)
    try {
      await onToggle(phaseId, label, !isDone)
    } catch (error) {
      console.error('Error toggling checklist item:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
        ${isDone 
          ? 'bg-gray-50 border border-gray-200' 
          : 'bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
        }
        ${isUpdating || updating ? 'opacity-50 cursor-wait' : 'hover:shadow-sm'}
      `}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0">
        {isUpdating || updating ? (
          <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center">
            <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${isDone 
                ? 'bg-[#8359ee] border-[#8359ee]' 
                : 'border-gray-300 bg-white'
              }
            `}
          >
            {isDone && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Label */}
      <span
        className={`
          flex-1 text-sm transition-all
          ${isDone 
            ? 'text-gray-500 line-through' 
            : 'text-gray-900'
          }
        `}
      >
        {label}
      </span>
    </div>
  )
}

