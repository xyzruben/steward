import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns true if the device is likely a mobile/touch device.
 * Used for mobile micro-interactions and responsive animation tuning.
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
    ('ontouchstart' in window && window.matchMedia('(pointer: coarse)').matches)
  )
} 