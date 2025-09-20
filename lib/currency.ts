import { useState, useEffect } from 'react'

interface CurrencyConfig {
  code: string
  symbol: string
  rate: number // Rate from USD
}

interface CountryCurrency {
  [key: string]: CurrencyConfig
}

// Exchange rates (in a real app, you'd fetch these from an API)
const CURRENCY_RATES: CountryCurrency = {
  'US': { code: 'USD', symbol: '$', rate: 1 },
  'GB': { code: 'GBP', symbol: '£', rate: 0.79 },
  'EU': { code: 'EUR', symbol: '€', rate: 0.85 },
  'CA': { code: 'CAD', symbol: 'C$', rate: 1.25 },
  'AU': { code: 'AUD', symbol: 'A$', rate: 1.35 },
  'JP': { code: 'JPY', symbol: '¥', rate: 110 },
  'IN': { code: 'INR', symbol: '₹', rate: 75 },
  'BR': { code: 'BRL', symbol: 'R$', rate: 5.2 },
  'MX': { code: 'MXN', symbol: '$', rate: 18 },
  'ZA': { code: 'ZAR', symbol: 'R', rate: 14.5 },
}

// Map of country codes to currency regions
const COUNTRY_TO_CURRENCY: { [key: string]: string } = {
  // North America
  'US': 'US',
  'CA': 'CA',
  'MX': 'MX',
  
  // Europe (using EUR for most EU countries)
  'GB': 'GB',
  'DE': 'EU', 'FR': 'EU', 'IT': 'EU', 'ES': 'EU', 'NL': 'EU',
  'BE': 'EU', 'AT': 'EU', 'PT': 'EU', 'IE': 'EU', 'FI': 'EU',
  'GR': 'EU', 'LU': 'EU', 'MT': 'EU', 'CY': 'EU', 'SK': 'EU',
  'SI': 'EU', 'EE': 'EU', 'LV': 'EU', 'LT': 'EU',
  
  // Asia Pacific
  'JP': 'JP',
  'AU': 'AU',
  'IN': 'IN',
  
  // South America
  'BR': 'BR',
  
  // Africa
  'ZA': 'ZA',
}

export async function getUserCurrency(): Promise<CurrencyConfig> {
  try {
    // Try to get user's location from IP
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    if (data.country_code) {
      const currencyRegion = COUNTRY_TO_CURRENCY[data.country_code]
      if (currencyRegion && CURRENCY_RATES[currencyRegion]) {
        return CURRENCY_RATES[currencyRegion]
      }
    }
  } catch (error) {
    console.log('Could not detect user location, using USD')
  }
  
  // Fallback to USD
  return CURRENCY_RATES['US']
}

export function convertPrice(usdPrice: number, currency: CurrencyConfig): number {
  const convertedPrice = usdPrice * currency.rate
  
  // Round to appropriate decimal places based on currency
  if (currency.code === 'JPY') {
    return Math.round(convertedPrice) // No decimals for JPY
  }
  
  return Math.round(convertedPrice * 100) / 100 // 2 decimal places for others
}

export function formatPrice(price: number, currency: CurrencyConfig): string {
  const convertedPrice = convertPrice(price, currency)
  
  if (currency.code === 'JPY') {
    return `${currency.symbol}${convertedPrice.toLocaleString()}`
  }
  
  return `${currency.symbol}${convertedPrice.toFixed(2)}`
}

// Hook for React components
export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCY_RATES['US'])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    getUserCurrency().then((detectedCurrency) => {
      setCurrency(detectedCurrency)
      setLoading(false)
    })
  }, [])
  
  return { currency, loading, formatPrice: (price: number) => formatPrice(price, currency) }
}
