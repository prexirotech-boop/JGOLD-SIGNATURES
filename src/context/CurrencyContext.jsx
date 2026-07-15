import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CurrencyContext = createContext()

const symbols = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£'
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('NGN')
  const [rates, setRates] = useState({
    NGN: 1,
    USD: 1500, // 1 USD = 1500 NGN
    EUR: 1650, // 1 EUR = 1650 NGN
    GBP: 1950  // 1 GBP = 1950 NGN
  })
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch currency settings
  useEffect(() => {
    async function loadCurrencySettings() {
      try {
        const { data } = await supabase.from('settings').select('*').eq('id', 'currency_config').maybeSingle()
        if (data?.value) {
          const config = data.value
          setIsEnabled(!!config.enable_multi_currency)
          if (config.rates) {
            setRates(prev => ({
              ...prev,
              ...config.rates
            }))
          }

          // If multi-currency is enabled, check user preference or auto-detect
          if (config.enable_multi_currency) {
            const saved = localStorage.getItem('user_currency')
            if (saved && symbols[saved]) {
              setCurrencyState(saved)
            } else {
              // Auto-detect country and currency code
              try {
                const res = await fetch('https://ipapi.co/json/')
                const geo = await res.json()
                if (geo?.currency && symbols[geo.currency]) {
                  setCurrencyState(geo.currency)
                  localStorage.setItem('user_currency', geo.currency)
                }
              } catch (geoErr) {
                console.warn('[Currency] Geolocation detection failed:', geoErr)
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Currency] Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCurrencySettings()
  }, [])

  const setCurrency = (code) => {
    if (symbols[code]) {
      setCurrencyState(code)
      localStorage.setItem('user_currency', code)
    }
  }

  // Converts a base NGN price into the active currency value
  const convertPrice = (amountNgn) => {
    const num = Number(amountNgn) || 0
    if (!isEnabled || currency === 'NGN') {
      return num
    }
    const rate = rates[currency] || 1
    return num / rate
  }

  // Converts a converted value back to the base NGN amount
  const convertBackToNgn = (amountInActiveCurrency) => {
    const num = Number(amountInActiveCurrency) || 0
    if (!isEnabled || currency === 'NGN') {
      return num
    }
    const rate = rates[currency] || 1
    return num * rate
  }

  // Formats a base NGN price with the correct symbol and decimals
  const formatPrice = (amountNgn) => {
    const num = Number(amountNgn)
    if (isNaN(num)) return amountNgn

    const converted = convertPrice(num)
    const symbol = isEnabled ? (symbols[currency] || '₦') : '₦'
    const activeCode = isEnabled ? currency : 'NGN'

    if (activeCode === 'NGN') {
      return `${symbol}${Math.round(converted).toLocaleString()}`
    } else {
      return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }

  return (
    <CurrencyContext.Provider value={{
      currency: isEnabled ? currency : 'NGN',
      symbol: isEnabled ? (symbols[currency] || '₦') : '₦',
      rates,
      isEnabled,
      convertPrice,
      convertBackToNgn,
      formatPrice,
      setCurrency,
      loading
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
