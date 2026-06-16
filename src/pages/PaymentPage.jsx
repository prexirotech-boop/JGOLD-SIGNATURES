import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CONFIG } from '../lib/config'
import { supabase, createPendingOrder, completeOrder } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// SHOPIFY-STYLE FIELD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function Field({ id, label, hint, type = 'text', placeholder, val, err, disabled, onChange, right }) {
  const [showPwd, setShowPwd] = useState(false)
  const isPwd = type === 'password'
  const [focused, setFocused] = useState(false)

  return (
    <div className={`sp-field-group ${err ? 'has-error' : ''} ${focused ? 'focused' : ''} ${val ? 'has-value' : ''}`}>
      <div className="sp-input-container">
        <input
          id={id}
          type={isPwd && showPwd ? 'text' : type}
          placeholder={placeholder}
          className="sp-input"
          value={val}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : isPwd ? 'new-password' : 'name'}
        />
        <label className="sp-label" htmlFor={id}>
          {label}
          {hint && <span className="sp-label-hint">{hint}</span>}
        </label>
        
        {isPwd && (
          <button
            type="button"
            className="sp-pwd-toggle"
            tabIndex={-1}
            onClick={() => setShowPwd(p => !p)}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
        {right && !isPwd && <div className="sp-field-right-elem">{right}</div>}
      </div>
      {err && <p className="sp-field-error-msg">{err}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SHOPIFY-STYLE PAYMENT PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productIdParam = searchParams.get('product')
  const { user } = useAuth()

  // Product data
  const [product, setProduct] = useState(null)

  // Form fields
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    phone: typeof window !== 'undefined' ? localStorage.getItem('checkout_phone') || '' : '' 
  })
  const [errors, setErrors] = useState({})

  // Authentication check states
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [loginPassword, setLoginPassword] = useState('')
  const [guestPassword, setGuestPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // State flags
  const [loading, setLoading] = useState(false)
  const [psReady, setPsReady] = useState(!!window.PaystackPop)
  const [imgError, setImgError] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  // Coupon application states
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponErr, setCouponErr] = useState('')
  const [couponOk, setCouponOk] = useState('')

  const paidRef = useRef(false)
  const pendingOrderIdRef = useRef(null)

  // Derived attributes
  const isEbook = product ? product.type === 'ebook' : false
  const productTitle = product ? product.title.replace(/\s+slug$/i, '') : (isEbook ? 'The N50K Blueprint (PDF)' : CONFIG.BOOK_TITLE)
  const bonuses = product && Array.isArray(product.features) ? product.features.filter(Boolean) : []
  const basePrice = product ? product.price : CONFIG.PRICE_NAIRA
  const oldPrice = product?.old_price || null

  const discountedPrice = appliedCoupon
    ? appliedCoupon.type === 'percentage'
      ? Math.round(basePrice * (1 - appliedCoupon.value / 100))
      : Math.max(0, basePrice - appliedCoupon.value)
    : basePrice

  // Load product from database and sync with cart
  useEffect(() => {
    async function load() {
      let activeProduct = null
      
      if (productIdParam) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productIdParam)
        let q = supabase.from('products').select('*')
        q = isUUID ? q.eq('id', productIdParam) : q.eq('slug', productIdParam)
        const { data } = await q.maybeSingle()
        if (data) activeProduct = data
      }
      
      if (!activeProduct) {
        // Try loading from cart
        try {
          const cart = JSON.parse(localStorage.getItem('amplified_cart')) || []
          if (cart.length > 0) {
            const { data } = await supabase.from('products').select('*').eq('id', cart[0].id).maybeSingle()
            if (data) activeProduct = data
          }
        } catch (e) {
          console.error('[PaymentPage] Error reading cart:', e)
        }
      }
      
      if (!activeProduct) {
        // Fallback to latest published course
        const { data: fb } = await supabase.from('products').select('*')
          .eq('type', 'course').eq('is_published', true)
          .order('created_at', { ascending: false }).limit(1).maybeSingle()
        if (fb) activeProduct = fb
      }
      
      if (activeProduct) {
        setProduct(activeProduct)
        
        // Auto-add checkout product to cart if not present
        try {
          const cartKey = 'amplified_cart'
          let cart = JSON.parse(localStorage.getItem(cartKey)) || []
          if (!cart.some(item => item.id === activeProduct.id)) {
            cart.push({
              id: activeProduct.id,
              title: activeProduct.title,
              price: activeProduct.price,
              old_price: activeProduct.old_price,
              cover_image: activeProduct.cover_image,
              type: activeProduct.type,
              slug: activeProduct.slug
            })
            localStorage.setItem(cartKey, JSON.stringify(cart))
            window.dispatchEvent(new Event('cart_updated'))
          }
        } catch (e) {
          console.error('[PaymentPage] Error writing cart:', e)
        }
      }
    }
    load()
  }, [productIdParam])

  // Pre-populate if student is logged in
  useEffect(() => {
    if (user) {
      setForm(f => ({ ...f, email: user.email || '', name: user.user_metadata?.full_name || f.name }))
    }
  }, [user])

  // Load Paystack SDK
  useEffect(() => {
    if (!window.PaystackPop) {
      const s = document.createElement('script')
      s.src = 'https://js.paystack.co/v1/inline.js'
      s.async = true
      s.onload = () => setPsReady(true)
      document.head.appendChild(s)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Auto-detect email existence to toggle login/register forms
  useEffect(() => {
    if (!form.email || user) { setEmailExists(false); return }
    const email = form.email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setEmailExists(false); return }
    const t = setTimeout(async () => {
      setCheckingEmail(true)
      try {
        const { data } = await supabase.from('profiles').select('id').eq('email', email.toLowerCase()).maybeSingle()
        setEmailExists(!!data?.id)
      } finally {
        setCheckingEmail(false)
      }
    }, 700)
    return () => clearTimeout(t)
  }, [form.email, user])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
    if (k === 'phone') {
      localStorage.setItem('checkout_phone', v)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Please enter your full name'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Please enter a valid email address'
    if (!/^(\+234|0)[789]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid phone number'
    if (!user && !emailExists && guestPassword.length < 6) e.password = 'Password must be at least 6 characters'
    if (!user && emailExists && !loginPassword) e.loginPassword = 'Password is required for this email'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true); setCouponErr(''); setCouponOk(''); setAppliedCoupon(null)
    try {
      const { data } = await supabase.from('coupons').select('*').eq('code', code).eq('is_active', true).maybeSingle()
      if (!data) { setCouponErr('Invalid or expired coupon code.'); return }
      if (data.usage_limit && data.usage_count >= data.usage_limit) { setCouponErr('This coupon has reached its usage limit.'); return }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { setCouponErr('This coupon has expired.'); return }
      setAppliedCoupon(data)
      setCouponOk(`Coupon applied — you save ${data.type === 'percentage' ? `${data.value}%` : `₦${data.value.toLocaleString()}`}`)
    } catch { 
      setCouponErr('Could not validate coupon. Please try again.')
    } finally { 
      setCouponLoading(false) 
    }
  }

  const pay = async () => {
    if (!validate()) return
    if (!psReady || !window.PaystackPop) {
      alert('Payment service is loading. Please wait a moment and try again.')
      return
    }

    const name  = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const phone = form.phone.trim()

    setLoading(true)

    let userId = user?.id || null
    try {
      if (!user) {
        if (emailExists) {
          const { data: si, error: siErr } = await supabase.auth.signInWithPassword({ email, password: loginPassword })
          if (siErr) { 
            setErrors({ loginPassword: 'Incorrect password. Please try again.' })
            setLoading(false)
            return 
          }
          userId = si.user?.id || null
        } else {
          const { data: su, error: suErr } = await supabase.auth.signUp({
            email, password: guestPassword,
            options: { data: { full_name: name } }
          })
          if (suErr) {
            if (suErr.message?.toLowerCase().includes('already registered')) {
              const { data: si2 } = await supabase.auth.signInWithPassword({ email, password: guestPassword })
              userId = si2?.user?.id || null
            } else {
              setErrors({ email: suErr.message }); setLoading(false); return
            }
          } else if (su?.user) {
            userId = su.user.id
            const { data: si3 } = await supabase.auth.signInWithPassword({ email, password: guestPassword })
            if (si3?.user) userId = si3.user.id
          }
        }
      }
    } catch (err) {
      setErrors({ email: 'Could not set up account. Please try again.' }); setLoading(false); return
    }

    const ref = `n50k_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const { orderId } = await createPendingOrder({
      reference: ref, name, email, phone,
      productId: product?.id || null,
      amount: discountedPrice,
    })
    pendingOrderIdRef.current = orderId

    if (window.fbq) window.fbq('track', 'Lead', { content_name: productTitle, value: discountedPrice, currency: 'NGN' })

    setLoading(false)
    paidRef.current = false

    try {
      const handler = window.PaystackPop.setup({
        key: CONFIG.PAYSTACK_PUBLIC_KEY,
        email,
        amount: discountedPrice * 100,
        currency: 'NGN',
        ref,
        metadata: {
          custom_fields: [
            { display_name: 'Name',    variable_name: 'customer_name',  value: name },
            { display_name: 'Phone',   variable_name: 'phone',          value: phone },
            { display_name: 'Product', variable_name: 'product_title',  value: productTitle },
          ]
        },
        callback: (transaction) => {
          paidRef.current = true
          handleSuccess({ reference: transaction.reference || ref, userId, name, email, phone })
        },
        onClose: () => {
          if (!paidRef.current) {
            if (pendingOrderIdRef.current) {
              supabase.from('orders').update({ status: 'cancelled' }).eq('id', pendingOrderIdRef.current).catch(() => {})
            }
            setLoading(false)
          }
        },
      })
      handler.openIframe()
    } catch (err) {
      console.error('[PaymentPage] Paystack SDK error:', err)
      alert('Could not start payment. Please check your internet connection and refresh the page.')
      setLoading(false)
    }
  }

  const handleSuccess = async ({ reference, userId, name, email, phone }) => {
    setLoading(true)
    if (window.fbq) window.fbq('track', 'Purchase', { value: discountedPrice, currency: 'NGN', content_name: productTitle })

    localStorage.setItem('paid_customer', JSON.stringify({
      name, email, phone, ref: reference,
      product_id: product?.id,
      product_type: product?.type,
      product_title: productTitle,
    }))

    await completeOrder({
      reference,
      userId,
      productId: product?.id || null,
      productType: product?.type || (isEbook ? 'ebook' : 'course'),
      name,
      phone,
    })

    if (isEbook) {
      navigate('/success')
      return
    }

    let hasSession = false
    if (userId) {
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession()
        if (data?.session?.user) { hasSession = true; break }
        await new Promise(r => setTimeout(r, 500))
      }
    }

    setLoading(false)
    navigate(hasSession ? '/dashboard' : '/setup-account')
  }

  const displayBonuses = bonuses

  const renderSummaryContent = () => (
    <div className="shopify-summary-content">
      {/* Product Information */}
      <div className="shopify-product-row">
        <div className="shopify-thumbnail-container">
          <div className="shopify-thumbnail-wrapper">
            {product?.cover_image && !imgError ? (
              <img src={product.cover_image} alt={productTitle} onError={() => setImgError(true)} className="shopify-thumbnail-img" />
            ) : (
              <div className="shopify-thumbnail-fallback">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4"/></svg>
              </div>
            )}
            <span className="shopify-thumbnail-badge">1</span>
          </div>
        </div>
        <div className="shopify-product-info">
          <h4 className="shopify-product-title">{productTitle}</h4>
          <span className="shopify-product-desc">
            {isEbook ? 'Digital PDF Guide & Masterclass' : 'Full Access Course + Support'}
          </span>
        </div>
        <div className="shopify-product-price-col">
          <span className="shopify-item-price">₦{basePrice.toLocaleString()}</span>
        </div>
      </div>

      {/* Bonuses */}
      {displayBonuses.length > 0 && (
        <div className="shopify-bonuses-box">
          <p className="shopify-section-label">Included Bonuses (Free)</p>
          {displayBonuses.map(b => (
            <div key={b} className="shopify-bonus-item">
              <span className="shopify-bonus-text">
                <span className="plus">+</span> {b}
              </span>
              <span className="shopify-free-badge">FREE</span>
            </div>
          ))}
        </div>
      )}

      {/* Coupon Field */}
      <div className="shopify-coupon-container">
        {!appliedCoupon ? (
          <div className="shopify-coupon-input-row">
            <div className="shopify-coupon-field-wrapper">
              <input
                type="text" 
                placeholder="Discount code"
                className="shopify-coupon-input"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponErr(''); setCouponOk('') }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (couponCode.trim()) applyCoupon();
                  }
                }}
                autoComplete="one-time-code"
                spellCheck="false"
                inputMode="text"
                name="coupon-input"
                id="coupon-input"
              />
            </div>
            <button
              type="button" 
              onClick={() => { if (couponCode.trim()) applyCoupon(); }}
              disabled={couponLoading || !couponCode.trim()}
              className="shopify-coupon-btn"
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
        ) : (
          <div className="shopify-applied-coupon-tag">
            <span className="tag-left">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 6 }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              <strong>{appliedCoupon.code}</strong>
            </span>
            <button 
              type="button" 
              onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponErr(''); setCouponOk('') }}
              className="shopify-remove-coupon-btn"
            >
              ×
            </button>
          </div>
        )}
        {couponErr && <p className="shopify-coupon-err-msg">{couponErr}</p>}
        {couponOk && <p className="shopify-coupon-ok-msg">{couponOk}</p>}
      </div>

      {/* Subtotal, Shipping, Discount Calculations */}
      <div className="shopify-calculations-block">
        <div className="shopify-calc-row">
          <span>Subtotal</span>
          <span className="calc-value">₦{basePrice.toLocaleString()}</span>
        </div>
        {appliedCoupon && (
          <div className="shopify-calc-row highlight-green">
            <span>Discount</span>
            <span className="calc-value">-{appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `₦${appliedCoupon.value.toLocaleString()}`}</span>
          </div>
        )}

        
        <div className="shopify-total-row">
          <span className="total-label">Total</span>
          <div className="total-price-wrapper">
            <span className="total-currency">NGN</span>
            <span className="total-amount">₦{discountedPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Safe SSL Guarantee Box */}
      <div className="shopify-guarantee-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <p>Instant &amp; secure delivery. Access is created immediately upon purchase confirmation.</p>
      </div>
    </div>
  )

  return (
    <div className="sp-checkout-root">
      <style>{`
        /* SHOPIFY THEME CUSTOMIZATION VARIABLES */
        .sp-checkout-root {
          font-family: var(--font), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #ffffff;
          min-height: 100vh;
          color: #333333;
          overflow-x: hidden;
        }

        /* GRID LAYOUT */
        .sp-checkout-layout {
          display: grid;
          grid-template-columns: 1fr;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media(min-width: 1000px) {
          .sp-checkout-layout {
            grid-template-columns: 1.15fr 0.85fr;
            min-height: 100vh;
          }
        }

        /* LEFT PANEL (Billing / Information) */
        .sp-left-panel {
          padding: 32px 24px 10px;
          background: #ffffff;
        }
        @media(min-width: 1000px) {
          .sp-left-panel {
            padding: 56px 48px 56px 24px;
            border-right: 1px solid #e6e6e6;
          }
        }
        .sp-logo-wrapper {
          margin-bottom: 24px;
        }
        .sp-logo {
          max-height: 34px;
          width: auto;
        }
        
        /* BREADCRUMB */
        .sp-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #707070;
          margin-bottom: 28px;
        }
        .sp-breadcrumb a, .sp-breadcrumb span {
          color: #707070;
        }
        .sp-breadcrumb span.active {
          color: #1a1a1a;
          font-weight: 600;
        }
        .sp-breadcrumb .arrow-separator {
          color: #a0a0a0;
          font-size: 10px;
        }

        /* SECTION TITLE */
        .sp-section-title {
          font-family: 'Asimov', var(--font-heading), sans-serif !important;
          font-size: 17.5px;
          font-weight: 900;
          color: #1a1a1a;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .sp-section-sub-link {
          font-family: var(--font), sans-serif !important;
          font-size: 13px;
          color: var(--g600);
          text-decoration: none;
          font-weight: 400 !important;
        }

        /* CONTACT FORM BLOCK */
        .sp-form-card {
          margin-bottom: 36px;
        }
        .sp-input-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* SHOPIFY INPUT FIELD STYLING */
        .sp-field-group {
          position: relative;
          width: 100%;
        }
        .sp-input-container {
          position: relative;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sp-input-container:hover {
          border-color: #cbd5e1;
        }
        .sp-field-group.focused .sp-input-container {
          background: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12) !important;
        }
        .sp-field-group.has-error .sp-input-container {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
        }
        .sp-input {
          width: 100% !important;
          padding: 24px 14px 8px !important;
          font-size: 14.5px !important;
          border: none !important;
          border-radius: 10px !important;
          background: transparent !important;
          background-color: transparent !important;
          outline: none !important;
          color: #1e293b !important;
          height: 54px !important;
          box-shadow: none !important;
          font-weight: 500 !important;
          line-height: 1.1 !important;
          box-sizing: border-box !important;
          transition: all 0.2s ease;
        }
        .sp-input::placeholder {
          color: transparent !important;
          transition: color 0.15s ease !important;
        }
        .sp-input:focus::placeholder {
          color: #94a3b8 !important;
        }
        .sp-label {
          position: absolute;
          left: 14px;
          top: 17px;
          font-size: 14px;
          color: #64748b;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          font-weight: 500;
        }
        .sp-field-group.focused .sp-label,
        .sp-field-group.has-value .sp-label,
        .sp-input:focus + .sp-label {
          transform: translateY(-9px) !important;
          font-size: 11px !important;
          top: 15px !important;
          color: #64748b;
          font-weight: 600;
        }
        .sp-field-group.focused .sp-label {
          color: #2563eb;
        }
        .sp-field-group.has-error .sp-label {
          color: #ef4444;
        }
        .sp-label-hint {
          font-size: 9.5px;
          color: #94a3b8;
          margin-left: 6px;
          font-weight: normal;
        }
        .sp-pwd-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #707070;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .sp-field-right-elem {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
        .sp-field-error-msg {
          font-size: 12px;
          color: #ff3838;
          margin: 4px 0 0;
          padding-left: 2px;
        }

        /* AUTO DETECTING ACCOUNTS BOXES */
        .sp-detect-box {
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .sp-detect-box.warn {
          background: #fffbef;
          border: 1px solid #fceca7;
          color: #6a4d04;
        }
        .sp-detect-box.info {
          background: #f4f8ff;
          border: 1px solid #d4e5ff;
          color: #1a4480;
        }
        .sp-detect-box p {
          margin: 0 0 6px;
          font-weight: 600;
          font-size: 14px;
        }
        .sp-detect-box small {
          display: block;
          margin-bottom: 12px;
          color: inherit;
          opacity: 0.85;
        }

        /* EXPRESS CHECKOUT SEPARATOR */
        .sp-checkout-separator {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: #707070;
          font-size: 12px;
        }
        .sp-checkout-separator::before, .sp-checkout-separator::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #e6e6e6;
        }
        .sp-checkout-separator:not(:empty)::before {
          margin-right: 12px;
        }
        .sp-checkout-separator:not(:empty)::after {
          margin-left: 12px;
        }

        /* PAYMENT BLOCK STYLING */
        .sp-payment-container {
          border: 1px solid #d9d9d9;
          border-radius: 5px;
          overflow: hidden;
          background: #ffffff;
        }
        .sp-payment-header {
          background: #fbfbfb;
          padding: 14px 16px;
          border-bottom: 1px solid #e6e6e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .sp-payment-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
          font-size: 14px;
        }
        .sp-payment-header-right {
          display: flex;
          gap: 6px;
        }
        @media(max-width: 550px) {
          .sp-payment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .sp-payment-header-right {
            padding-left: 24px;
          }
        }
        .sp-payment-body {
          padding: 18px 16px;
          background: #fcfcfc;
          border-bottom: 1px solid #e6e6e6;
        }
        .sp-payment-body p {
          font-size: 13.5px;
          color: #606060;
          margin: 0;
          line-height: 1.5;
        }
        .sp-payment-footer {
          padding: 18px 16px;
          background: #ffffff;
        }

        /* SUBMIT BUTTON */
        .sp-submit-btn {
          width: 100%;
          padding: 16px;
          background: var(--g800);
          color: #ffffff;
          border-radius: 5px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s, opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
        }
        .sp-submit-btn:hover {
          background: var(--g900);
        }
        .sp-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* LOGGED IN STRIP */
        .sp-logged-in-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f4fdf8;
          border: 1px solid #cef1dc;
          border-radius: 5px;
          padding: 10px 14px;
          margin-bottom: 18px;
          font-size: 13px;
          color: #1e7040;
        }
        .sp-logout-btn {
          background: none;
          border: none;
          color: #dc2626;
          font-weight: 600;
          cursor: pointer;
          font-size: 12.5px;
          text-decoration: underline;
        }

        /* RIGHT PANEL (Order Summary) */
        .sp-right-panel {
          display: none;
          background: #fafafa;
          padding: 32px 24px;
          border-top: 1px solid #e6e6e6;
        }
        @media(min-width: 1000px) {
          .sp-right-panel {
            display: block;
            padding: 56px 24px 56px 48px;
            border-top: none;
            min-height: 100vh;
            position: sticky;
            top: 0;
            background: #fafafa;
          }
          .sp-right-panel::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            right: -2000px;
            background: #fafafa;
            z-index: -1;
            pointer-events: none;
          }
        }

        /* SHOPIFY ORDER SUMMARY STYLING */
        .shopify-product-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .shopify-thumbnail-container {
          flex-shrink: 0;
        }
        .shopify-thumbnail-wrapper {
          position: relative;
          width: 64px;
          height: 64px;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shopify-thumbnail-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
        }
        .shopify-thumbnail-fallback {
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--g700), var(--g500));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shopify-thumbnail-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background: #808080;
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
        }
        .shopify-product-info {
          flex: 1;
          min-width: 0;
        }
        .shopify-product-title {
          font-size: 14px;
          font-weight: 500;
          color: #333333;
          margin: 0 0 4px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .shopify-product-desc {
          font-size: 12px;
          color: #707070;
          display: block;
        }
        .shopify-product-price-col {
          flex-shrink: 0;
          font-size: 14px;
          font-weight: 500;
          color: #333333;
        }

        /* BONUSES BOX */
        .shopify-bonuses-box {
          border-top: 1px solid #e6e6e6;
          padding: 16px 0;
          margin-bottom: 8px;
        }
        .shopify-section-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #707070;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px;
        }
        .shopify-bonus-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          padding: 4px 0;
          color: #444444;
        }
        .shopify-bonus-text .plus {
          color: #16a34a;
          font-weight: bold;
        }
        .shopify-free-badge {
          font-size: 9px;
          font-weight: 700;
          background: #eefdf4;
          border: 1px solid #bcf1cc;
          color: #16a34a;
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* COUPON */
        .shopify-coupon-container {
          border-top: 1px solid #e6e6e6;
          padding: 18px 0;
        }
        .shopify-coupon-input-row {
          display: flex;
          gap: 12px;
        }
        .shopify-coupon-field-wrapper {
          flex: 1;
        }
        .shopify-coupon-input {
          width: 100%;
          height: 40px;
          padding: 8px 12px;
          border: 1px solid #d9d9d9;
          border-radius: 5px;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.2s;
        }
        .shopify-coupon-input:focus {
          border-color: #2563eb;
        }
        .shopify-coupon-btn {
          height: 40px;
          padding: 0 16px;
          background: #e6e6e6;
          color: #545454;
          border: none;
          border-radius: 5px;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s, color 0.2s;
        }
        .shopify-coupon-btn:not(:disabled) {
          background: #808080;
          color: #ffffff;
        }
        .shopify-coupon-btn:not(:disabled):hover {
          background: #606060;
        }
        .shopify-coupon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }
        .shopify-applied-coupon-tag {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          padding: 6px 12px;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          color: #545454;
        }
        .tag-left {
          display: flex;
          align-items: center;
        }
        .shopify-remove-coupon-btn {
          background: none;
          border: none;
          color: #707070;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        .shopify-remove-coupon-btn:hover {
          color: #1a1a1a;
        }
        .shopify-coupon-err-msg {
          color: #ff3838;
          font-size: 12px;
          margin: 6px 0 0;
        }
        .shopify-coupon-ok-msg {
          color: #16a34a;
          font-size: 12px;
          margin: 6px 0 0;
        }

        /* CALCULATIONS BLOCK */
        .shopify-calculations-block {
          border-top: 1px solid #e6e6e6;
          padding: 16px 0;
        }
        .shopify-calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 13.5px;
          color: #545454;
          margin-bottom: 8px;
        }
        .shopify-calc-row.highlight-green {
          color: #16a34a;
        }
        .shopify-calc-row .calc-value {
          font-weight: 500;
        }
        .shopify-calc-row .calc-value.text-muted {
          color: #707070;
        }
        .shopify-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e6e6e6;
        }
        .total-label {
          font-size: 16px;
          font-weight: 500;
          color: #333333;
        }
        .total-price-wrapper {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }
        .total-currency {
          font-size: 11px;
          color: #707070;
        }
        .total-amount {
          font-size: 20px;
          font-weight: 600;
          color: #1a1a1a;
        }

        /* SECURE GUARANTEE BOX */
        .shopify-guarantee-box {
          margin-top: 24px;
          display: flex;
          gap: 12px;
          background: #f4f6f8;
          border: 1px solid #e6e6e6;
          border-radius: 5px;
          padding: 12px 14px;
        }
        .shopify-guarantee-box p {
          font-size: 12px;
          color: #545454;
          margin: 0;
          line-height: 1.5;
        }

        /* MOBILE OVERLAY / DRAWER COLLAPSIBLE */
        .sp-mobile-summary-bar {
          display: flex;
          background: #fafafa;
          border-bottom: 1px solid #e6e6e6;
          padding: 16px 24px;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .sp-mobile-summary-bar-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          color: #2563eb;
        }
        .sp-mobile-summary-bar-price {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .sp-mobile-summary-drawer {
          display: none;
          background: #fafafa;
          border-bottom: 1px solid #e6e6e6;
          padding: 24px 24px;
          animation: drawerSlide 0.25s ease-out;
        }
        .sp-mobile-summary-drawer.open {
          display: block;
        }
        @keyframes drawerSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media(min-width: 1000px) {
          .sp-mobile-summary-bar {
            display: none;
          }
          .sp-mobile-summary-drawer {
            display: none !important;
          }
        }

        /* SPINNER */
        .sp-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .sp-email-checking {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #707070;
          margin-top: 6px;
          padding-left: 2px;
        }
        .sp-email-checking-spinner {
          width: 10px;
          height: 10px;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .sp-checkout-footer {
          margin-top: 10px;
          border-top: 1px solid #e6e6e6;
          padding-top: 16px;
          display: flex;
          gap: 14px;
          font-size: 11px;
          color: #707070;
        }
        .sp-checkout-footer a {
          color: #707070;
          text-decoration: none;
        }
        .sp-checkout-footer a:hover {
          color: #1a1a1a;
          text-decoration: underline;
        }
      `}</style>

      {/* Mobile Sticky summary header */}
      <div className="sp-mobile-summary-bar" onClick={() => setSummaryOpen(!summaryOpen)}>
        <div className="sp-mobile-summary-bar-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6"/></svg>
          <span>{summaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: summaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <span className="sp-mobile-summary-bar-price">₦{discountedPrice.toLocaleString()}</span>
      </div>
      
      {/* Mobile dropdown cart details */}
      <div className={`sp-mobile-summary-drawer ${summaryOpen ? 'open' : ''}`}>
        {renderSummaryContent()}
      </div>

      <div className="sp-checkout-layout">
        
        {/* LEFT COLUMN: CONTACT, SHIPPING, PAYMENT (WHITE BACK) */}
        <div className="sp-left-panel">
          
          {/* Logo */}
          <div className="sp-logo-wrapper">
            <Link to="/">
              <img src="/logo.png" alt="Amplified Skills" className="sp-logo" onError={e => { e.currentTarget.style.display = 'none' }} />
            </Link>
          </div>

          {/* Breadcrumb breadcrumb */}
          <nav className="sp-breadcrumb">
            <Link to="/">Home</Link>
            <span className="arrow-separator">›</span>
            <span className="active">Information</span>
            <span className="arrow-separator">›</span>
            <span>Payment</span>
          </nav>

          {/* Contact Information block */}
          <form onSubmit={e => { e.preventDefault(); pay(); }}>
            <div className="sp-form-card">
              <h3 className="sp-section-title">
                Contact Information
                {!user && <Link to="/login" className="sp-section-sub-link">Already have an account? Log in</Link>}
              </h3>

              {/* Logged in state */}
              {user && (
                <div className="sp-logged-in-strip">
                  <span>Logged in as <strong>{user.email}</strong></span>
                  <button type="button" onClick={() => supabase.auth.signOut()} className="sp-logout-btn">Log out</button>
                </div>
              )}

              <div className="sp-input-stack">
                <Field 
                  id="email" 
                  label="Email address" 
                  hint={isEbook ? ' (For downloading delivery)' : ' (For course dashboard access)'} 
                  type="email" 
                  placeholder="chioma@gmail.com" 
                  val={form.email} 
                  err={errors.email} 
                  disabled={!!user} 
                  onChange={v => set('email', v)} 
                />

                {checkingEmail && (
                  <div className="sp-email-checking">
                    <span className="sp-email-checking-spinner" />
                    <span>Checking database...</span>
                  </div>
                )}

                {/* Inline authentication detected - user must input password */}
                {!user && emailExists && !checkingEmail && (
                  <div className="sp-detect-box warn">
                    <p>Existing Account Detected</p>
                    <small>You already have a student profile. Enter your password to authenticate this purchase.</small>
                    <Field
                      id="inline-login-pw"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      val={loginPassword}
                      err={errors.loginPassword || loginError}
                      onChange={v => { setLoginPassword(v); setLoginError(''); setErrors(er => ({ ...er, loginPassword: '' })) }}
                      right={<a href="/forgot-password" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Forgot?</a>}
                    />
                  </div>
                )}

                {/* New User detected - create password */}
                {!user && !emailExists && !checkingEmail && form.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) && (
                  <div className="sp-detect-box info">
                    <p>Secure Student Account Setup</p>
                    <small>Create a password. This secures your dashboard account where you can access the training materials.</small>
                    <Field
                      id="guest-pw"
                      label="Create dashboard password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      val={guestPassword}
                      err={errors.password}
                      onChange={v => { setGuestPassword(v); if (errors.password) setErrors(e => ({ ...e, password: '' })) }}
                    />
                  </div>
                )}

                <Field 
                  id="name" 
                  label="Full name" 
                  placeholder="Chioma Adeyemi" 
                  val={form.name} 
                  err={errors.name} 
                  disabled={!!user} 
                  onChange={v => set('name', v)} 
                />

                <Field 
                  id="phone" 
                  label="Phone number (WhatsApp active)" 
                  type="tel" 
                  placeholder="08031234567" 
                  val={form.phone} 
                  err={errors.phone} 
                  onChange={v => set('phone', v)} 
                />
              </div>
            </div>

            {/* Payment Section */}
            <div className="sp-form-card">
              <h3 className="sp-section-title">Payment Method</h3>
              <div className="sp-payment-container">
                <div className="sp-payment-header">
                  <div className="sp-payment-header-left">
                    <input type="radio" checked readOnly style={{ accentColor: '#1a1a1a', cursor: 'pointer' }} />
                    <span>Secure Paystack Gateway</span>
                  </div>
                  <div className="sp-payment-header-right">
                    <span style={{ fontSize: '11px', color: '#707070' }}>CARDS &bull; BANK TRANSFER &bull; USSD</span>
                  </div>
                </div>
                
                <div className="sp-payment-body">
                  <p>After clicking "Complete Payment", you will be redirected to the secure Paystack checkout pop-up to authorize your payment using card, transfer, app, or USSD.</p>
                </div>

                <div className="sp-payment-footer">
                  {emailExists && !user && (
                    <p style={{ fontSize: '12.5px', color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '10px 12px', marginBottom: 14 }}>
                      ⚠️ Please fill in your account password above to authorize payment processing.
                    </p>
                  )}
                  
                  <button
                    type="submit" 
                    disabled={loading || (emailExists && !user && !loginPassword)}
                    className="sp-submit-btn"
                  >
                    {loading ? (
                      <>
                        <span className="sp-spinner" />
                        <span>Securing Connection...</span>
                      </>
                    ) : (
                      <span>Complete Payment — ₦{discountedPrice.toLocaleString()}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Footer policies Shopify style */}
          <footer className="sp-checkout-footer">
            <Link to="/refund" target="_blank">Refund policy</Link>
            <Link to="/privacy" target="_blank">Privacy policy</Link>
            <Link to="/terms" target="_blank">Terms of service</Link>
            <Link to="/contact" target="_blank">Contact details</Link>
          </footer>

        </div>

        {/* RIGHT COLUMN: STICKY ORDER SUMMARY (GREY BACK) */}
        <div className="sp-right-panel">
          {renderSummaryContent()}
        </div>

      </div>
    </div>
  )
}
