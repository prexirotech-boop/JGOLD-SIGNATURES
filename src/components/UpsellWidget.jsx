import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/* ─── Helpers ─────────────────────────────────────────────────────────── */

function formatNGN(kobo) {
  return (kobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })
}

function getDiscountedPrice(offer) {
  const base = offer.offered_product?.price || 0
  if (offer.discount_type === 'percentage')
    return Math.round(base * (1 - offer.discount_value / 100))
  if (offer.discount_type === 'fixed')
    return Math.max(0, base - offer.discount_value * 100)
  return base
}

function getDiscountLabel(offer) {
  if (offer.discount_type === 'percentage') return `${offer.discount_value}%`
  if (offer.discount_type === 'fixed') return formatNGN(offer.discount_value * 100)
  return ''
}

function hasDiscount(offer) {
  return (
    (offer.discount_type === 'percentage' && offer.discount_value > 0) ||
    (offer.discount_type === 'fixed' && offer.discount_value > 0)
  )
}

function fallbackImg(e) {
  e.target.src =
    'https://via.placeholder.com/400x300/7c3aed/ffffff?text=Course'
}

/* ─── Countdown Hook ─────────────────────────────────────────────────── */

function useCountdown(initialSeconds) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const seconds = String(timeLeft % 60).padStart(2, '0')
  return { minutes, seconds, expired: timeLeft === 0 }
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

/* Checkout — Order Bump Card */
function CheckoutOfferCard({ offer, onAddToOrder }) {
  const [checked, setChecked] = useState(false)
  const [hovered, setHovered] = useState(false)

  const originalPrice = offer.offered_product?.price || 0
  const discountedPrice = getDiscountedPrice(offer)
  const showDiscount = hasDiscount(offer)
  const cover = offer.offered_product?.cover_image

  const handleChange = (e) => {
    setChecked(e.target.checked)
    if (e.target.checked && onAddToOrder) onAddToOrder(offer)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${checked ? '#5b21b6' : hovered ? '#a78bfa' : '#7c3aed'}`,
        borderRadius: 14,
        padding: '16px 20px',
        background: checked ? '#f3eeff' : '#faf8ff',
        marginBottom: 14,
        transition: 'all 0.25s ease',
        boxShadow: checked
          ? '0 4px 20px rgba(124,58,237,0.18)'
          : hovered
          ? '0 2px 12px rgba(124,58,237,0.10)'
          : 'none',
        cursor: 'pointer',
      }}
      onClick={() => {
        const next = !checked
        setChecked(next)
        if (next && onAddToOrder) onAddToOrder(offer)
      }}
    >
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
        {/* Checkbox */}
        <div style={{ paddingTop: 3, flexShrink: 0 }}>
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            onClick={e => e.stopPropagation()}
            style={{
              width: 18,
              height: 18,
              accentColor: '#7c3aed',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge + Thumbnail row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white',
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 20,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              ⚡ ONE-TIME ADD-ON
            </span>

            {cover && (
              <img
                src={cover}
                alt={offer.offered_product?.title}
                onError={fallbackImg}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  objectFit: 'cover',
                  marginLeft: 12,
                  border: '2px solid #ede9fe',
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          {/* Headline */}
          <div style={{
            fontWeight: 800,
            fontSize: 15,
            color: '#1e1b4b',
            lineHeight: 1.35,
            marginBottom: 4,
          }}>
            {offer.headline || offer.offered_product?.title}
          </div>

          {/* Description */}
          {offer.description && (
            <div style={{
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.5,
              marginBottom: 10,
            }}>
              {offer.description}
            </div>
          )}

          {/* Pricing */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#7c3aed',
              letterSpacing: '-0.5px',
            }}>
              {formatNGN(discountedPrice)}
            </span>
            {showDiscount && (
              <>
                <span style={{
                  fontSize: 13,
                  textDecoration: 'line-through',
                  color: '#9ca3af',
                  fontWeight: 500,
                }}>
                  {formatNGN(originalPrice)}
                </span>
                <span style={{
                  fontSize: 11,
                  color: '#16a34a',
                  fontWeight: 700,
                  background: '#dcfce7',
                  padding: '2px 8px',
                  borderRadius: 20,
                }}>
                  SAVE {getDiscountLabel(offer)}
                </span>
              </>
            )}
          </div>
        </div>
      </label>

      {/* Checked confirmation strip */}
      {checked && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
          borderRadius: 8,
          color: 'white',
          fontSize: 12,
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.3px',
        }}>
          ✓ Added to your order!
        </div>
      )}
    </div>
  )
}

/* Thank You — Post-Purchase Urgency Banner */
function ThankYouOffer({ offer, navigate }) {
  const { minutes, seconds, expired } = useCountdown(15 * 60)
  const [hovered, setHovered] = useState(false)

  const originalPrice = offer.offered_product?.price || 0
  const discountedPrice = getDiscountedPrice(offer)
  const showDiscount = hasDiscount(offer)
  const cover = offer.offered_product?.cover_image
  const slug = offer.offered_product?.slug || offer.offered_product?.id

  const handleClaim = () => {
    navigate(`/checkout?product=${slug}&upsell=${offer.id}`)
  }

  if (expired) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(124,58,237,0.35)',
      marginBottom: 32,
      position: 'relative',
    }}>
      {/* Glowing top border */}
      <div style={{
        height: 4,
        background: 'linear-gradient(90deg, #f59e0b, #ef4444, #7c3aed, #06b6d4, #f59e0b)',
        backgroundSize: '300% 100%',
      }} />

      {/* Countdown bar */}
      <div style={{
        background: 'rgba(239,68,68,0.12)',
        borderBottom: '1px solid rgba(239,68,68,0.25)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <span style={{ color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
          ⏰ This offer expires in:
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            background: '#ef4444',
            color: 'white',
            fontWeight: 900,
            fontSize: 22,
            padding: '4px 10px',
            borderRadius: 8,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 48,
            textAlign: 'center',
            display: 'inline-block',
          }}>{minutes}</span>
          <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 18 }}>:</span>
          <span style={{
            background: '#ef4444',
            color: 'white',
            fontWeight: 900,
            fontSize: 22,
            padding: '4px 10px',
            borderRadius: 8,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 48,
            textAlign: 'center',
            display: 'inline-block',
          }}>{seconds}</span>
        </div>
        <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 500 }}>remaining</span>
      </div>

      {/* Main content */}
      <div style={{
        padding: '28px 32px',
        display: 'flex',
        gap: 28,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* Left: text */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: 'white',
            fontSize: 12,
            fontWeight: 800,
            padding: '4px 14px',
            borderRadius: 20,
            marginBottom: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            ⚡ Special One-Time Offer — Just For You!
          </div>

          <h2 style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 900,
            lineHeight: 1.3,
            margin: '0 0 10px',
          }}>
            {offer.headline || offer.offered_product?.title}
          </h2>

          {offer.description && (
            <p style={{
              color: '#c4b5fd',
              fontSize: 14,
              lineHeight: 1.65,
              margin: '0 0 20px',
            }}>
              {offer.description}
            </p>
          )}

          {/* Pricing */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
            <span style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#a78bfa',
              letterSpacing: '-1px',
            }}>
              {formatNGN(discountedPrice)}
            </span>
            {showDiscount && (
              <>
                <span style={{
                  fontSize: 18,
                  fontWeight: 500,
                  textDecoration: 'line-through',
                  color: '#6b7280',
                }}>
                  {formatNGN(originalPrice)}
                </span>
                <span style={{
                  background: '#16a34a',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 20,
                }}>
                  SAVE {getDiscountLabel(offer)}
                </span>
              </>
            )}
          </div>

          {/* CTA Button */}
          <button
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleClaim}
            style={{
              background: hovered
                ? 'linear-gradient(135deg, #5b21b6, #7c3aed)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.3px',
              boxShadow: hovered
                ? '0 8px 30px rgba(124,58,237,0.55)'
                : '0 4px 16px rgba(124,58,237,0.35)',
              transform: hovered ? 'translateY(-2px)' : 'none',
              transition: 'all 0.2s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Claim This Offer Now →
          </button>

          <p style={{
            color: '#9ca3af',
            fontSize: 11,
            marginTop: 10,
            marginBottom: 0,
          }}>
            🔒 Secure checkout · Instant access · No recurring fees
          </p>
        </div>

        {/* Right: Product image */}
        {cover && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={cover}
              alt={offer.offered_product?.title}
              onError={fallbackImg}
              style={{
                width: 180,
                height: 180,
                borderRadius: 16,
                objectFit: 'cover',
                border: '3px solid rgba(167,139,250,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* Product / Dashboard — Cross-Sell Card */
function CrossSellCard({ offer, navigate }) {
  const [hovered, setHovered] = useState(false)

  const originalPrice = offer.offered_product?.price || 0
  const discountedPrice = getDiscountedPrice(offer)
  const showDiscount = hasDiscount(offer)
  const cover = offer.offered_product?.cover_image
  const slug = offer.offered_product?.slug || offer.offered_product?.id
  const type = offer.offered_product?.type

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1.5px solid ${hovered ? '#c4b5fd' : '#f0eeff'}`,
        boxShadow: hovered
          ? '0 12px 40px rgba(124,58,237,0.15)'
          : '0 2px 12px rgba(0,0,0,0.06)',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-4px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image */}
      <div style={{
        height: 160,
        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {cover ? (
          <img
            src={cover}
            alt={offer.offered_product?.title}
            onError={fallbackImg}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.4s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
          }}>
            📚
          </div>
        )}
        {showDiscount && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            color: 'white',
            fontSize: 11,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 20,
            boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
          }}>
            -{getDiscountLabel(offer)}
          </div>
        )}
        {type && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(4px)',
            color: '#7c3aed',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {type}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontWeight: 700,
          fontSize: 14,
          color: '#1a1f36',
          lineHeight: 1.4,
          marginBottom: 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {offer.headline || offer.offered_product?.title}
        </div>

        {offer.description && (
          <div style={{
            fontSize: 12,
            color: '#6b7280',
            lineHeight: 1.5,
            marginBottom: 10,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {offer.description}
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#7c3aed' }}>
              {formatNGN(discountedPrice)}
            </span>
            {showDiscount && (
              <span style={{ fontSize: 12, textDecoration: 'line-through', color: '#9ca3af' }}>
                {formatNGN(originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={() => navigate(`/product/${slug}`)}
            style={{
              width: '100%',
              background: hovered
                ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                : 'white',
              color: hovered ? 'white' : '#7c3aed',
              border: '1.5px solid #7c3aed',
              borderRadius: 8,
              padding: '9px 0',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              letterSpacing: '0.2px',
            }}
          >
            Learn More →
          </button>
        </div>
      </div>
    </div>
  )
}

/* Homepage — Featured Deal Banner */
function HomepageBanner({ offer, navigate }) {
  const [hovered, setHovered] = useState(false)

  const originalPrice = offer.offered_product?.price || 0
  const discountedPrice = getDiscountedPrice(offer)
  const showDiscount = hasDiscount(offer)
  const cover = offer.offered_product?.cover_image
  const slug = offer.offered_product?.slug || offer.offered_product?.id

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f0c29 0%, #1e1b4b 35%, #302b63 65%, #24243e 100%)',
      borderRadius: 24,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 20px 80px rgba(124,58,237,0.25)',
      marginBottom: 40,
    }}>
      {/* Background decoration blobs */}
      <div style={{
        position: 'absolute',
        top: -80,
        right: -80,
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        padding: '36px 40px',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Left — Text */}
        <div style={{ flex: 1, minWidth: 260 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: 'white',
            fontSize: 12,
            fontWeight: 900,
            padding: '5px 14px',
            borderRadius: 20,
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
          }}>
            🔥 Bundle Deal
          </div>

          <h2 style={{
            color: 'white',
            fontSize: 28,
            fontWeight: 900,
            lineHeight: 1.25,
            margin: '0 0 12px',
            letterSpacing: '-0.5px',
          }}>
            {offer.headline || offer.offered_product?.title}
          </h2>

          {offer.description && (
            <p style={{
              color: '#c4b5fd',
              fontSize: 15,
              lineHeight: 1.7,
              margin: '0 0 24px',
              maxWidth: 480,
            }}>
              {offer.description}
            </p>
          )}

          {/* Pricing row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <span style={{
              fontSize: 36,
              fontWeight: 900,
              color: '#a78bfa',
              letterSpacing: '-1px',
              lineHeight: 1,
            }}>
              {formatNGN(discountedPrice)}
            </span>
            {showDiscount && (
              <>
                <span style={{
                  fontSize: 20,
                  fontWeight: 500,
                  textDecoration: 'line-through',
                  color: '#6b7280',
                }}>
                  {formatNGN(originalPrice)}
                </span>
                <div style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '5px 14px',
                  borderRadius: 20,
                  boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                }}>
                  SAVE {getDiscountLabel(offer)}
                </div>
              </>
            )}
          </div>

          {/* CTA */}
          <button
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => navigate(`/product/${slug}`)}
            style={{
              background: hovered
                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                : 'linear-gradient(135deg, #7c3aed, #a855f7)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              padding: '15px 34px',
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.3px',
              boxShadow: hovered
                ? '0 10px 40px rgba(124,58,237,0.6)'
                : '0 6px 24px rgba(124,58,237,0.4)',
              transform: hovered ? 'translateY(-3px) scale(1.02)' : 'none',
              transition: 'all 0.22s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            Get This Deal Now 🚀
          </button>
        </div>

        {/* Right — Product image */}
        {cover && (
          <div style={{ flexShrink: 0 }}>
            <div style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 16px 56px rgba(0,0,0,0.5)',
            }}>
              <img
                src={cover}
                alt={offer.offered_product?.title}
                onError={fallbackImg}
                style={{
                  width: 240,
                  height: 240,
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Overlay shimmer */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, transparent 60%, rgba(124,58,237,0.25))',
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────── */

export default function UpsellWidget({
  placement,
  triggerProductId,
  userId,
  onAddToOrder,
  limit = 3,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const resolvedUserId = userId || user?.id

  const [filteredOffers, setFilteredOffers] = useState([])
  const [loading, setLoading] = useState(true)

  const logImpressions = useCallback(async (offerIds) => {
    try {
      if (!offerIds.length) return
      await supabase.from('upsell_impressions').insert(
        offerIds.map(id => ({
          offer_id: id,
          user_id: resolvedUserId || null,
          placement,
          trigger_product_id: triggerProductId || null,
          created_at: new Date().toISOString(),
        }))
      )
    } catch {
      // Non-blocking — silently ignore
    }
  }, [placement, resolvedUserId, triggerProductId])

  useEffect(() => {
    let cancelled = false

    async function fetchOffers() {
      try {
        setLoading(true)

        let query = supabase
          .from('upsell_offers')
          .select(`
            *,
            offered_product:products!upsell_offers_offered_product_id_fkey(
              id, title, price, cover_image, type, slug
            )
          `)
          .eq('is_active', true)
          .contains('show_on_pages', [placement])
          .order('display_order')
          .limit(limit)

        if (triggerProductId) {
          query = query.or(
            `trigger_product_id.eq.${triggerProductId},trigger_product_id.is.null`
          )
        } else {
          query = query.is('trigger_product_id', null)
        }

        const { data: offers, error } = await query
        if (error || !offers || cancelled) return

        // Filter out already-owned products
        let available = offers
        if (resolvedUserId) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', resolvedUserId)

          const enrolledIds = (enrollments || []).map(e => e.course_id)
          available = offers.filter(o => !enrolledIds.includes(o.offered_product_id))
        }

        if (cancelled) return
        setFilteredOffers(available)

        // Log impressions non-blocking
        logImpressions(available.map(o => o.id))
      } catch {
        // Graceful silence
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchOffers()
    return () => { cancelled = true }
  }, [placement, triggerProductId, resolvedUserId, limit, logImpressions])

  // Nothing to show
  if (loading || filteredOffers.length === 0) return null

  /* ── Checkout: Order Bump Cards ── */
  if (placement === 'checkout') {
    return (
      <div style={{ marginTop: 24 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #e5e7eb)' }} />
          <span style={{
            fontSize: 12,
            fontWeight: 800,
            color: '#7c3aed',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            whiteSpace: 'nowrap',
          }}>
            🎁 Exclusive Add-Ons
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #e5e7eb)' }} />
        </div>
        {filteredOffers.map(offer => (
          <CheckoutOfferCard key={offer.id} offer={offer} onAddToOrder={onAddToOrder} />
        ))}
      </div>
    )
  }

  /* ── Thank You: Post-Purchase Banner ── */
  if (placement === 'thankyou') {
    return (
      <div style={{ marginTop: 32 }}>
        <ThankYouOffer offer={filteredOffers[0]} navigate={navigate} />
      </div>
    )
  }

  /* ── Product / Dashboard: Cross-Sell Grid ── */
  if (placement === 'product' || placement === 'dashboard') {
    const heading =
      placement === 'dashboard' ? '✨ Recommended For You' : '🎯 You Might Also Like'

    return (
      <div style={{ marginTop: 40 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 20,
          gap: 16,
        }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#1a1f36',
            margin: 0,
            letterSpacing: '-0.3px',
            whiteSpace: 'nowrap',
          }}>
            {heading}
          </h3>
          <div style={{
            flex: 1,
            height: 3,
            background: 'linear-gradient(to right, rgba(124,58,237,0.15), transparent)',
            borderRadius: 2,
          }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {filteredOffers.slice(0, 3).map(offer => (
            <CrossSellCard key={offer.id} offer={offer} navigate={navigate} />
          ))}
        </div>
      </div>
    )
  }

  /* ── Homepage: Full-Width Banner ── */
  if (placement === 'homepage') {
    return (
      <div style={{ marginTop: 40 }}>
        <HomepageBanner offer={filteredOffers[0]} navigate={navigate} />
      </div>
    )
  }

  return null
}
