import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  order_bump: { 
    label: 'Order Bump',       
    color: '#7c3aed', 
    bg: '#f5f3ff', 
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ) 
  },
  post_purchase: { 
    label: 'Post-Purchase',    
    color: '#2563eb', 
    bg: '#eff6ff', 
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ) 
  },
  cross_sell: { 
    label: 'Cross-sell',        
    color: '#059669', 
    bg: '#ecfdf5', 
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <polyline points="16 3 21 3 21 8"/>
        <line x1="4" y1="20" x2="21" y2="3"/>
        <polyline points="21 16 21 21 16 21"/>
        <line x1="15" y1="15" x2="21" y2="21"/>
        <line x1="4" y1="4" x2="9" y2="9"/>
      </svg>
    ) 
  },
  bundle_deal: { 
    label: 'Bundle Deal',       
    color: '#d97706', 
    bg: '#fffbeb', 
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
        <polygon points="12 22.08 12 12 3 6.92 3 16.15 12 22.08"/>
        <polygon points="12 22.08 21 16.15 21 6.92 12 12 12 22.08"/>
        <polygon points="12 12 21 6.92 12 1.85 3 6.92 12 12"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ) 
  },
  homepage_banner: { 
    label: 'Homepage Banner',  
    color: '#dc2626', 
    bg: '#fef2f2', 
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ) 
  },
}

const PLACEMENT_OPTIONS = [
  { value: 'checkout',   label: 'Checkout' },
  { value: 'thankyou',  label: 'Thank You Page' },
  { value: 'product',   label: 'Product Page' },
  { value: 'dashboard', label: 'Student Dashboard' },
  { value: 'homepage',  label: 'Homepage' },
]

const BLANK_FORM = {
  name: '',
  offer_type: 'order_bump',
  trigger_product_id: '',
  offered_product_id: '',
  headline: '',
  description: '',
  cta_text: 'Add to Order',
  discount_type: 'none',
  discount_value: '',
  display_order: 0,
  placement_pages: [],
  is_active: true,
}

const SELECT_ARROW = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23697386' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (kobo) => `₦${Number((kobo || 0) / 100).toLocaleString('en-NG')}`

function getDiscountedPrice(originalPrice, discountType, discountValue) {
  if (discountType === 'percentage') return Math.round(originalPrice * (1 - discountValue / 100))
  if (discountType === 'fixed')      return Math.max(0, originalPrice - discountValue * 100)
  return originalPrice
}

function conversionColor(rate) {
  if (rate >= 15) return { color: '#15803d', bg: '#dcfce7' }
  if (rate >= 6)  return { color: '#b45309', bg: '#fef3c7' }
  return                { color: '#b91c1c', bg: '#fee2e2' }
}

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e3e8ee',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: accent + '18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: '#697386', marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: accent, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
      </div>
    </div>
  )
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: '#697386', bg: '#f1f5f9', icon: '•' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '3px 9px',
      borderRadius: 20,
      background: cfg.bg,
      color: cfg.color,
      fontSize: 11.5,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? '#2563eb' : '#cbd5e1',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: 3,
        left: checked ? 21 : 3,
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        transition: 'left 0.18s',
      }} />
    </div>
  )
}

function PlacementCheckboxes({ value = [], onChange }) {
  const toggle = (v) => {
    if (value.includes(v)) onChange(value.filter(x => x !== v))
    else onChange([...value, v])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {PLACEMENT_OPTIONS.map(opt => {
        const active = value.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: `1.5px solid ${active ? '#2563eb' : '#cbd5e1'}`,
              background: active ? '#eff6ff' : '#f8fafc',
              color: active ? '#2563eb' : '#697386',
              fontSize: 12.5,
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW MODAL
// ─────────────────────────────────────────────────────────────────────────────

function PreviewModal({ offer, onClose }) {
  const ref = useRef(null)
  useClickOutside(ref, onClose)

  const product = offer.offered_product
  const discountedKobo = product
    ? getDiscountedPrice(product.price, offer.discount_type, offer.discount_value)
    : 0
  const hasDiscount = offer.discount_type !== 'none' && offer.discount_value

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.55)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16,
    }}>
      <div ref={ref} style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#a5b4fc', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
              Offer Preview — {TYPE_CONFIG[offer.offer_type]?.label}
            </div>
            <div style={{ fontSize: 13, color: '#e0e7ff', marginTop: 2 }}>{offer.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 8, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: '28px 28px 24px' }}>
          <div style={{
            border: '2px dashed #e0e7ff',
            borderRadius: 12,
            padding: 20,
            background: '#fafbff',
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}>
                {product?.cover_image
                  ? <img src={product.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '📚'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1f36', lineHeight: 1.3 }}>
                  {offer.headline || 'Your offer headline goes here'}
                </div>
                <div style={{ fontSize: 13, color: '#697386', marginTop: 6, lineHeight: 1.5 }}>
                  {offer.description || 'Your offer description will appear here.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
                  {product && (
                    <>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>
                        {fmt(discountedKobo)}
                      </span>
                      {hasDiscount && (
                        <span style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'line-through' }}>
                          {fmt(product.price)}
                        </span>
                      )}
                      {hasDiscount && offer.discount_type === 'percentage' && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', background: '#dcfce7', padding: '2px 7px', borderRadius: 20 }}>
                          {offer.discount_value}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <button style={{
              marginTop: 16,
              width: '100%',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.3,
            }}>
              {offer.cta_text || 'Add to Order'}
            </button>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(offer.placement_pages || []).map(p => (
              <span key={p} style={{ fontSize: 11.5, color: '#4f46e5', background: '#ede9fe', padding: '3px 9px', borderRadius: 20, fontWeight: 500 }}>
                {PLACEMENT_OPTIONS.find(o => o.value === p)?.label || p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE / EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SELECT COMPONENT (Emoji-free, with SVGs and text formatting)
// ─────────────────────────────────────────────────────────────────────────────

function CustomSelect({ value, onChange, options, placeholder = "Select an option..." }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  
  useClickOutside(containerRef, () => setIsOpen(false))

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: 8,
          border: isOpen ? '1.5px solid #4f46e5' : '1.5px solid #e2e8f0',
          fontSize: '13.5px',
          color: '#1a1f36',
          backgroundColor: '#fafbfc',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.15s',
          fontFamily: 'inherit',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(79, 70, 229, 0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {selectedOption?.icon && (
            <span style={{ display: 'inline-flex', flexShrink: 0, color: selectedOption.iconColor || '#6b7280' }}>
              {selectedOption.icon}
            </span>
          )}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: selectedOption ? 500 : 400 }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
            marginLeft: '8px',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 9999,
            padding: '4px',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                  color: isSelected ? '#1e40af' : '#1a1f36',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#f1f5f9'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: isSelected ? 600 : 500 }}>
                  {opt.icon && (
                    <span style={{ display: 'inline-flex', flexShrink: 0, color: opt.iconColor || (isSelected ? '#1d4ed8' : '#6b7280') }}>
                      {opt.icon}
                    </span>
                  )}
                  <span>{opt.label}</span>
                </div>
                {opt.subtitle && (
                  <div style={{ fontSize: '11px', color: isSelected ? '#3b82f6' : '#64748b', marginLeft: opt.icon ? '22px' : '0' }}>
                    {opt.subtitle}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OfferModal({ editOffer, products, onClose, onSaved }) {
  const isEdit = !!editOffer

  const [form, setForm] = useState(() => {
    if (editOffer) {
      return {
        name:               editOffer.name || '',
        offer_type:         editOffer.offer_type || 'order_bump',
        trigger_product_id: editOffer.trigger_product_id || '',
        offered_product_id: editOffer.offered_product_id || '',
        headline:           editOffer.headline || '',
        description:        editOffer.description || '',
        cta_text:           editOffer.cta_text || 'Add to Order',
        discount_type:      editOffer.discount_type || 'none',
        discount_value:     editOffer.discount_value || '',
        display_order:      editOffer.display_order ?? 0,
        placement_pages:    editOffer.placement_pages || [],
        is_active:          editOffer.is_active ?? true,
      }
    }
    return { ...BLANK_FORM }
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim())             return setError('Internal name is required.')
    if (!form.offered_product_id)      return setError('Please select an offered product.')
    if (!form.headline.trim())         return setError('Headline is required.')
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        name:               form.name.trim(),
        offer_type:         form.offer_type,
        trigger_product_id: form.trigger_product_id || null,
        offered_product_id: form.offered_product_id,
        headline:           form.headline.trim(),
        description:        form.description.trim(),
        cta_text:           form.cta_text.trim() || 'Add to Order',
        discount_type:      form.discount_type,
        discount_value:     form.discount_type !== 'none' ? parseFloat(form.discount_value) || 0 : null,
        display_order:      parseInt(form.display_order) || 0,
        placement_pages:    form.placement_pages,
        is_active:          form.is_active,
      }
      if (isEdit) {
        const { error: err } = await supabase.from('upsell_offers').update(payload).eq('id', editOffer.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('upsell_offers').insert(payload)
        if (err) throw err
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1.5px solid #e2e8f0',
    fontSize: 13.5,
    color: '#1a1f36',
    backgroundColor: '#fafbfc',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    fontWeight: 600,
    fontSize: 12.5,
    marginBottom: 6,
    color: '#374151',
    letterSpacing: 0.2,
  }

  const sectionHeaderStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: '1px solid #f1f5f9',
  }

  const offerTypeOptions = Object.entries(TYPE_CONFIG).map(([k, v]) => ({
    value: k,
    label: v.label,
    icon: v.icon,
    iconColor: v.color
  }))

  const triggerProductOptions = [
    { value: '', label: 'Show everywhere (all products)' },
    ...products.map(p => ({
      value: p.id,
      label: p.title,
      subtitle: fmt(p.price)
    }))
  ]

  const offeredProductOptions = [
    { value: '', label: 'Select a product...' },
    ...products.map(p => ({
      value: p.id,
      label: p.title,
      subtitle: fmt(p.price)
    }))
  ]

  const discountTypeOptions = [
    { value: 'none', label: 'No Discount' },
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount (₦)' }
  ]

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, zIndex: 1000,
      backdropFilter: 'blur(4px)',
    }}>
      <style>{`
        .offer-modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
        }
        @media (max-width: 800px) {
          .offer-modal-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      `}</style>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 950,
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: '20px 28px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: 0 }}>
              {isEdit ? 'Edit Offer' : 'Create New Offer'}
            </h3>
            <p style={{ color: '#a5b4fc', fontSize: 12.5, margin: '4px 0 0' }}>
              {isEdit ? `Editing: ${editOffer.name}` : 'Set up a new upsell or cross-sell offer'}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', color: '#fff',
            width: 32, height: 32,
            borderRadius: 8, cursor: 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{
          padding: '28px 28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          overflowY: 'auto',
        }}>
          
          <div className="offer-modal-grid">
            
            {/* Left Column: identity, products, toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={sectionHeaderStyle}>Offer Identity</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Internal Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="e.g. Post-Purchase Course Bundle for SEO Masterclass"
                      style={inputStyle}
                      required
                    />
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Only visible in admin. Used to identify this offer.</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={labelStyle}>Offer Type *</label>
                      <CustomSelect
                        value={form.offer_type}
                        onChange={v => set('offer_type', v)}
                        options={offerTypeOptions}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Display Order</label>
                      <input
                        type="number"
                        value={form.display_order}
                        onChange={e => set('display_order', e.target.value)}
                        style={inputStyle}
                        min={0}
                        placeholder="0"
                      />
                      <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Lower = shown first</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={sectionHeaderStyle}>Products</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Trigger Product</label>
                    <CustomSelect
                      value={form.trigger_product_id}
                      onChange={v => set('trigger_product_id', v)}
                      options={triggerProductOptions}
                      placeholder="Show everywhere (all products)"
                    />
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>This offer appears when the selected product is being purchased.</div>
                  </div>
                  <div>
                    <label style={labelStyle}>Offered Product *</label>
                    <CustomSelect
                      value={form.offered_product_id}
                      onChange={v => set('offered_product_id', v)}
                      options={offeredProductOptions}
                      placeholder="Select a product..."
                    />
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>The product you are offering as an upsell.</div>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                marginTop: 'auto',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1a1f36' }}>Active Offer</div>
                  <div style={{ fontSize: 12, color: '#697386', marginTop: 2 }}>
                    {form.is_active ? 'Offer is live and visible to users' : 'Offer is hidden from users'}
                  </div>
                </div>
                <Toggle checked={form.is_active} onChange={v => set('is_active', v)} />
              </div>
            </div>
            
            {/* Right Column: copy, discount, placement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={sectionHeaderStyle}>Offer Copy (Customer-Facing)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Headline *</label>
                    <input
                      type="text"
                      value={form.headline}
                      onChange={e => set('headline', e.target.value)}
                      placeholder="e.g. Wait! Add our Advanced SEO Course at 50% off"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => set('description', e.target.value)}
                      rows={3}
                      placeholder="Describe the value of this offer in 1-2 sentences..."
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CTA Button Text</label>
                    <input
                      type="text"
                      value={form.cta_text}
                      onChange={e => set('cta_text', e.target.value)}
                      placeholder="Add to Order"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div style={sectionHeaderStyle}>Discount</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Discount Type</label>
                    <CustomSelect
                      value={form.discount_type}
                      onChange={v => set('discount_type', v)}
                      options={discountTypeOptions}
                    />
                  </div>
                  {form.discount_type !== 'none' && (
                    <div>
                      <label style={labelStyle}>
                        {form.discount_type === 'percentage' ? 'Percentage Off (%)' : 'Amount Off (₦)'}
                      </label>
                      <input
                        type="number"
                        value={form.discount_value}
                        onChange={e => set('discount_value', e.target.value)}
                        placeholder={form.discount_type === 'percentage' ? 'e.g. 30' : 'e.g. 2000'}
                        style={inputStyle}
                        min={0}
                        step={form.discount_type === 'percentage' ? 1 : 0.01}
                      />
                      {form.discount_type === 'fixed' && (
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Enter in Naira. Converted to kobo automatically.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={sectionHeaderStyle}>Placement</div>
                <label style={labelStyle}>Placement Pages</label>
                <PlacementCheckboxes
                  value={form.placement_pages}
                  onChange={v => set('placement_pages', v)}
                />
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8 }}>
                  Select where this offer should be displayed to users.
                </div>
              </div>
            </div>
            
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 6 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 20 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                background: submitting ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Offer'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: '#f8fafc',
                color: '#4f566b',
                border: '1.5px solid #e2e8f0',
                padding: '12px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TINY ACTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────

function ActionBtn({ label, icon, color, bg, onClick, disabled }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 10px',
        borderRadius: 7,
        border: `1px solid ${hovered ? color + '40' : 'transparent'}`,
        background: hovered ? bg : 'transparent',
        color: hovered ? color : '#697386',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminUpsells() {
  const [offers,   setOffers]   = useState([])
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  const [showModal,    setShowModal]    = useState(false)
  const [editOffer,    setEditOffer]    = useState(null)
  const [previewOffer, setPreviewOffer] = useState(null)

  const [togglingId,  setTogglingId]  = useState(null)
  const [deletingId,  setDeletingId]  = useState(null)
  const [filterType,  setFilterType]  = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const loadData = async () => {
    setLoading(true)
    const [{ data: offersData }, { data: productsData }] = await Promise.all([
      supabase
        .from('upsell_offers')
        .select(`
          *,
          trigger_product:products!upsell_offers_trigger_product_id_fkey(id, title, price),
          offered_product:products!upsell_offers_offered_product_id_fkey(id, title, price, cover_image)
        `)
        .order('display_order', { ascending: true }),
      supabase
        .from('products')
        .select('id, title, price, type, cover_image')
        .eq('is_published', true)
        .order('title'),
    ])
    if (offersData)   setOffers(offersData)
    if (productsData) setProducts(productsData)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const totalOffers      = offers.length
  const activeOffers     = offers.filter(o => o.is_active).length
  const totalImpressions = offers.reduce((s, o) => s + (o.impressions || 0), 0)
  const totalConversions = offers.reduce((s, o) => s + (o.conversions || 0), 0)
  const totalRevenue     = offers.reduce((s, o) => s + (o.revenue_kobo || 0), 0)
  const overallConvRate  = totalImpressions > 0 ? ((totalConversions / totalImpressions) * 100).toFixed(1) : 0

  const handleToggle = async (offer) => {
    setTogglingId(offer.id)
    try {
      await supabase.from('upsell_offers').update({ is_active: !offer.is_active }).eq('id', offer.id)
      setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, is_active: !o.is_active } : o))
    } catch {}
    setTogglingId(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this upsell offer? This action cannot be undone.')) return
    setDeletingId(id)
    try {
      await supabase.from('upsell_offers').delete().eq('id', id)
      setOffers(prev => prev.filter(o => o.id !== id))
    } catch {}
    setDeletingId(null)
  }

  const openCreate = () => { setEditOffer(null); setShowModal(true) }
  const openEdit   = (o) => { setEditOffer(o);   setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditOffer(null) }
  const onSaved    = () => { closeModal(); loadData() }

  const filtered = offers.filter(o => {
    if (filterType   !== 'all' && o.offer_type !== filterType)  return false
    if (filterStatus === 'active'   && !o.is_active)             return false
    if (filterStatus === 'inactive' &&  o.is_active)             return false
    return true
  })

  const pillBtnStyle = (active) => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: `1.5px solid ${active ? '#2563eb' : '#e2e8f0'}`,
    background: active ? '#eff6ff' : '#fff',
    color: active ? '#2563eb' : '#697386',
    fontSize: 12.5,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ fontFamily: 'var(--font, Inter, sans-serif)' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1a1f36', margin: 0 }}>
            Upsells &amp; Cross-sells
          </h2>
          <p style={{ color: '#697386', marginTop: 5, fontSize: 14, margin: '5px 0 0' }}>
            Create strategic offers that increase average order value and lifetime customer revenue.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
            color: '#fff',
            border: 'none',
            padding: '11px 20px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          ✨ Create New Offer
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard icon="🎁" label="Total Offers"         value={totalOffers}                                              accent="#7c3aed" />
        <StatCard icon="✅" label="Active Offers"        value={activeOffers}    sub={`${totalOffers - activeOffers} paused`} accent="#059669" />
        <StatCard icon="👁️" label="Total Impressions"    value={totalImpressions.toLocaleString()}                        accent="#2563eb" />
        <StatCard icon="🎯" label="Conversions"          value={totalConversions.toLocaleString()} sub={`${overallConvRate}% conv. rate`} accent="#d97706" />
        <StatCard icon="💸" label="Revenue from Upsells" value={fmt(totalRevenue)}                                        accent="#dc2626" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={pillBtnStyle(filterType === 'all')} onClick={() => setFilterType('all')}>All Types</button>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <button key={k} style={pillBtnStyle(filterType === k)} onClick={() => setFilterType(k)}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={pillBtnStyle(filterStatus === 'all')}      onClick={() => setFilterStatus('all')}>All</button>
          <button style={pillBtnStyle(filterStatus === 'active')}   onClick={() => setFilterStatus('active')}>Active</button>
          <button style={pillBtnStyle(filterStatus === 'inactive')} onClick={() => setFilterStatus('inactive')}>Inactive</button>
        </div>
        {filtered.length !== offers.length && (
          <span style={{ fontSize: 12.5, color: '#697386' }}>
            Showing {filtered.length} of {offers.length} offers
          </span>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={{
          background: '#fff', border: '1px solid #e3e8ee', borderRadius: 12,
          padding: '60px 24px', textAlign: 'center', color: '#697386',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Loading offers...</div>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div style={{
          background: '#fff', border: '2px dashed #e3e8ee', borderRadius: 16,
          padding: '70px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1f36', marginBottom: 8 }}>
            {offers.length === 0 ? 'No upsell offers yet' : 'No offers match your filters'}
          </div>
          <div style={{ fontSize: 14, color: '#697386', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            {offers.length === 0
              ? 'Create your first upsell or cross-sell offer to start boosting your revenue per customer.'
              : 'Try adjusting the filters above to see more offers.'}
          </div>
          {offers.length === 0 && (
            <button
              onClick={openCreate}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                color: '#fff', border: 'none', padding: '12px 24px',
                borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              ✨ Create First Offer
            </button>
          )}
        </div>
      ) : (
        /* Offers Table */
        <div style={{
          background: '#fff', border: '1px solid #e3e8ee', borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  {['Offer', 'Trigger', 'Offering', 'Placement', 'Performance', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 18px', color: '#8a94a6', fontSize: 11,
                      textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.8, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((offer, idx) => {
                  const discountedKobo = offer.offered_product
                    ? getDiscountedPrice(offer.offered_product.price, offer.discount_type, offer.discount_value)
                    : 0
                  const impressions = offer.impressions || 0
                  const conversions = offer.conversions || 0
                  const convRate    = impressions > 0 ? ((conversions / impressions) * 100).toFixed(1) : null
                  const convColors  = convRate !== null ? conversionColor(parseFloat(convRate)) : null
                  const isDeleting  = deletingId === offer.id
                  const isToggling  = togglingId === offer.id

                  return (
                    <tr
                      key={offer.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbfe'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Offer Name + Type */}
                      <td style={{ padding: '14px 18px', minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: TYPE_CONFIG[offer.offer_type]?.bg || '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, flexShrink: 0,
                          }}>
                            {TYPE_CONFIG[offer.offer_type]?.icon || '•'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1a1f36', lineHeight: 1.3 }}>
                              {offer.name}
                            </div>
                            <div style={{ marginTop: 4 }}>
                              <TypeBadge type={offer.offer_type} />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trigger Product */}
                      <td style={{ padding: '14px 18px', minWidth: 160 }}>
                        {offer.trigger_product ? (
                          <div>
                            <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                              {offer.trigger_product.title}
                            </div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                              {fmt(offer.trigger_product.price)}
                            </div>
                          </div>
                        ) : (
                          <span style={{
                            fontSize: 12, color: '#7c3aed', background: '#f5f3ff',
                            padding: '3px 9px', borderRadius: 20, fontWeight: 500,
                          }}>All Products</span>
                        )}
                      </td>

                      {/* Offered Product */}
                      <td style={{ padding: '14px 18px', minWidth: 200 }}>
                        {offer.offered_product ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 6,
                              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                              overflow: 'hidden', flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                            }}>
                              {offer.offered_product.cover_image
                                ? <img src={offer.offered_product.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : '📚'}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500, lineHeight: 1.3 }}>
                                {offer.offered_product.title}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>
                                  {fmt(discountedKobo)}
                                </span>
                                {offer.discount_type !== 'none' && offer.discount_value && (
                                  <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>
                                    {fmt(offer.offered_product.price)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Placement */}
                      <td style={{ padding: '14px 18px', minWidth: 160 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(offer.placement_pages || []).length === 0 ? (
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>Not set</span>
                          ) : (offer.placement_pages || []).map(p => (
                            <span key={p} style={{
                              fontSize: 11, color: '#4f566b', background: '#f1f5f9',
                              padding: '2px 7px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap',
                            }}>
                              {PLACEMENT_OPTIONS.find(o => o.value === p)?.label || p}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Performance */}
                      <td style={{ padding: '14px 18px', minWidth: 170 }}>
                        <div style={{ fontSize: 12.5, color: '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            <strong>{impressions.toLocaleString()}</strong> imp
                          </span>
                          <span style={{ color: '#cbd5e1' }}>|</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <strong>{conversions.toLocaleString()}</strong> conv
                          </span>
                        </div>
                        {convRate !== null && (
                          <div style={{ marginTop: 6 }}>
                            <span style={{
                              fontSize: 12, fontWeight: 700,
                              color: convColors.color, background: convColors.bg,
                              padding: '3px 9px', borderRadius: 20,
                            }}>
                              {convRate}% conv rate
                            </span>
                          </div>
                        )}
                        {offer.revenue_kobo > 0 && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#059669', marginTop: 5, fontWeight: 600 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="1" x2="12" y2="23" />
                              <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
                            </svg>
                            <span>{fmt(offer.revenue_kobo)} earned</span>
                          </div>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Toggle
                            checked={offer.is_active}
                            onChange={() => handleToggle(offer)}
                            disabled={isToggling}
                          />
                          <span style={{ fontSize: 12, fontWeight: 600, color: offer.is_active ? '#059669' : '#94a3b8' }}>
                            {isToggling ? '...' : offer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {offer.display_order != null && (
                          <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 4 }}>
                            Order #{offer.display_order}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <ActionBtn 
                            label="Edit"    
                            icon={
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                              </svg>
                            } 
                            color="#2563eb" 
                            bg="#eff6ff" 
                            onClick={() => openEdit(offer)} 
                          />
                          <ActionBtn 
                            label="Preview" 
                            icon={
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            } 
                            color="#7c3aed" 
                            bg="#f5f3ff" 
                            onClick={() => setPreviewOffer(offer)} 
                          />
                          <ActionBtn 
                            label={isDeleting ? '...' : 'Delete'} 
                            icon={
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            } 
                            color="#dc2626" 
                            bg="#fef2f2" 
                            onClick={() => !isDeleting && handleDelete(offer.id)} 
                            disabled={isDeleting} 
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div style={{
            padding: '12px 18px', borderTop: '1px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbfc',
          }}>
            <span style={{ fontSize: 12.5, color: '#697386' }}>
              {filtered.length} offer{filtered.length !== 1 ? 's' : ''} · {activeOffers} active
            </span>
            <div style={{ display: 'flex', gap: 16 }}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                const count = offers.filter(o => o.offer_type === k).length
                if (!count) return null
                return (
                  <span key={k} style={{ fontSize: 11.5, color: v.color }}>
                    {v.icon} {count} {v.label}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <OfferModal
          editOffer={editOffer}
          products={products}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {previewOffer && (
        <PreviewModal
          offer={previewOffer}
          onClose={() => setPreviewOffer(null)}
        />
      )}
    </div>
  )
}