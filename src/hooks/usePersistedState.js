import { useState, useEffect } from 'react'

export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch (e) {
      console.warn('Failed to load persisted state for key:', key, e)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (e) {
      console.warn('Failed to save persisted state for key:', key, e)
    }
  }, [key, state])

  return [state, setState]
}
