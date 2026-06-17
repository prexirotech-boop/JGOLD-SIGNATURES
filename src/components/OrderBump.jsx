import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function OrderBump({ triggerProductId, onBumpsChange, currentTotal }) {
  return null; // Order bumps disabled for now
  const [offers, setOffers] = useState([])
  const [selectedBumps, setSelectedBumps] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOffers() {
      try {
        let query = supabase
          .from('upsell_offers')
          .select(`
            *,
            offered_product:products!upsell_offers_offered_product_id_fkey(
              id, title, price, cover_image, type
            )
          `)
          .eq('is_active', true)
          .eq('type', 'order_bump')
          .contains('show_on_pages', ['checkout'])
          .order('display_order')

        if (triggerProductId) {
          query = query.or(`trigger_product_id.eq.${triggerProductId},trigger_product_id.is.null`)
        } else {
          query = query.is('trigger_product_id', null)
        }

        const { data, error } = await query
        if (error) throw error
        setOffers(data || [])
      } catch (err) {
        console.warn('[OrderBump] Load offers error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOffers()
  }, [triggerProductId])

  function toggleBump(offer) {
    setSelectedBumps(prev => {
      const next = { ...prev, [offer.id]: !prev[offer.id] }
      const selectedOffers = offers.filter(o => next[o.id])
      onBumpsChange?.(selectedOffers)
      return next
    })
  }

  function getDiscountedPrice(offer) {
    const base = offer.offered_product?.price || 0
    if (offer.discount_type === 'percentage') {
      return Math.round(base * (1 - offer.discount_value / 100))
    }
    if (offer.discount_type === 'fixed') {
      return Math.max(0, base - offer.discount_value) // DB stores discount in Naira
    }
    return base
  }

  function formatNGN(amount) {
    return `₦${amount.toLocaleString()}`
  }

  if (loading || offers.length === 0) return null

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e1b4b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          ⚡ Special Add-ons
        </h4>
        <span style={{ fontSize: 9, fontWeight: 800, background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Limited Offer
        </span>
      </div>

      {offers.map(offer => {
        const isChecked = !!selectedBumps[offer.id]
        const basePrice = offer.offered_product?.price || 0
        const discountedPrice = getDiscountedPrice(offer)
        const hasDiscount = offer.discount_type !== 'none' && offer.discount_value > 0

        const discountLabel = offer.discount_type === 'percentage' 
          ? `${offer.discount_value}%` 
          : `₦${offer.discount_value.toLocaleString()}`

        return (
          <div
            key={offer.id}
            onClick={() => toggleBump(offer)}
            style={{
              border: `2px dashed ${isChecked ? '#7c3aed' : '#e2e8f0'}`,
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 12,
              background: isChecked ? '#fdfaff' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              transform: isChecked ? 'scale(1.01)' : 'scale(1)',
              boxShadow: isChecked ? '0 4px 12px rgba(124,58,237,0.08)' : 'none'
            }}
          >
            {isChecked && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #7c3aed, #c084fc)' }} />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* Checkbox */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: `2px solid ${isChecked ? '#7c3aed' : '#cbd5e1'}`,
                background: isChecked ? '#7c3aed' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
                transition: 'all 0.15s'
              }}>
                {isChecked && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Product Thumbnail */}
              {offer.offered_product?.cover_image && (
                <img
                  src={offer.offered_product.cover_image}
                  alt={offer.offered_product.title}
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
              )}

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ background: '#7c3aed', color: '#ffffff', fontSize: 9, fontWeight: 700, padding: '1px 8px', borderRadius: 10, display: 'inline-block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ One-Time Offer
                </div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1e1b4b', lineHeight: 1.3 }}>{offer.headline}</div>
                {offer.description && (
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.4 }}>{offer.description}</div>
                )}
                
                {/* Pricing details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#7c3aed' }}>{formatNGN(discountedPrice)}</span>
                  {hasDiscount && (
                    <span style={{ fontSize: 12, textDecoration: 'line-through', color: '#9ca3af' }}>{formatNGN(basePrice)}</span>
                  )}
                  {hasDiscount && (
                    <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '1px 8px', borderRadius: 10 }}>
                      SAVE {discountLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
