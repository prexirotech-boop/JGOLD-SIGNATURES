import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'amplified_ref'
const DEFAULT_DURATION_DAYS = 30

export function useAffiliate() {
  const [referralCode, setReferralCode] = useState(null)
  const [affiliateConfig, setAffiliateConfig] = useState(null)

  useEffect(() => {
    // Load affiliate config
    loadConfig()
    // Try to read ref from URL first
    const params = new URLSearchParams(window.location.search)
    const refCode = params.get('ref')
    if (refCode) {
      storeReferral(refCode)
      setReferralCode(refCode)
    } else {
      const stored = getStoredReferral()
      if (stored) setReferralCode(stored)
    }
  }, [])

  async function loadConfig() {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('id', 'affiliate_config')
        .maybeSingle()
      if (data?.value) setAffiliateConfig(data.value)
    } catch(e) {
      // ignore
    }
  }

  function storeReferral(code) {
    const days = affiliateConfig?.cookie_duration_days || DEFAULT_DURATION_DAYS
    const expiry = Date.now() + (days * 24 * 60 * 60 * 1000)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, expiry }))
  }

  function getStoredReferral() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return parsed.code
    } catch(e) {
      return null
    }
  }

  function getReferralCode() {
    return referralCode
  }

  function clearReferralCode() {
    localStorage.removeItem(STORAGE_KEY)
    setReferralCode(null)
  }

  async function recordClick(affiliateCode, landingPage) {
    try {
      // Find the affiliate
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .eq('status', 'active')
        .maybeSingle()
      
      if (!affiliate) return

      // Record the click
      await supabase.from('affiliate_referrals').insert({
        affiliate_id: affiliate.id,
        affiliate_code: affiliateCode,
        landing_page: landingPage || window.location.href,
        user_agent: navigator.userAgent
      })

      // Increment click count
      await supabase.rpc('increment_affiliate_clicks', { p_affiliate_id: affiliate.id })
        .catch(() => {}) // ignore if RPC not available
    } catch(e) {
      console.warn('[useAffiliate] recordClick error:', e)
    }
  }

  return { referralCode, getReferralCode, clearReferralCode, storeReferral, recordClick, affiliateConfig }
}
