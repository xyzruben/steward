/**
 * Currency Conversion Service
 * Fetches and caches exchange rates for multi-currency support.
 * Uses exchangerate.host (free, no API key required).
 *
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - Scalability, Code Quality, Security
 */

import fetch from 'node-fetch'

// In-memory cache for rates (can be replaced with Redis/DB for production)
const rateCache: Record<string, { rate: number, timestamp: number }> = {}
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

/**
 * Fetches the exchange rate from one currency to another.
 * @param from ISO 4217 currency code (e.g., 'USD')
 * @param to ISO 4217 currency code (e.g., 'EUR')
 * @param date Optional date for historical rates (YYYY-MM-DD)
 * @returns Exchange rate (from -> to)
 */
export async function getExchangeRate(from: string, to: string, date?: string): Promise<number> {
  const cacheKey = `${from}_${to}_${date || 'latest'}`
  const now = Date.now()
  // Return cached rate if fresh
  if (rateCache[cacheKey] && now - rateCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return rateCache[cacheKey].rate
  }
  // Build API URL
  let url = `https://api.exchangerate.host/${date || 'latest'}?base=${from}&symbols=${to}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch exchange rate: ${res.status}`)
  const data = await res.json()
  const rate = data.rates?.[to]
  if (!rate || typeof rate !== 'number') throw new Error('Invalid exchange rate data')
  // Cache and return
  rateCache[cacheKey] = { rate, timestamp: now }
  return rate
}

/**
 * Converts an amount from one currency to another using live or historical rates.
 * @param amount Amount to convert
 * @param from ISO 4217 currency code (e.g., 'USD')
 * @param to ISO 4217 currency code (e.g., 'EUR')
 * @param date Optional date for historical rates (YYYY-MM-DD)
 * @returns Converted amount
 */
export async function convertCurrency(amount: number, from: string, to: string, date?: string): Promise<number> {
  if (from === to) return amount
  const rate = await getExchangeRate(from, to, date)
  return amount * rate
} 