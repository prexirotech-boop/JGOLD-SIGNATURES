import { useState, useEffect, useRef } from 'react'
import { CONFIG } from '../lib/config'
import { saveOrder } from '../lib/supabase'

const Field = ({ id, label, hint, type = 'text', placeholder, val, err, onChange }) => (
  <div className="f-group">
    <label className="f-label" htmlFor={id}>
      {label}{hint && <span style={{ fontSize: '.76rem', color: 'var(--g600)', fontWeight: 600, marginLeft: 6 }}>{hint}</span>}
    </label>
    <input
      id={id} type={type} placeholder={placeholder}
      className={`f-input${err ? ' has-error' : ''}`}
      value={val} onChange={e => onChange(e.target.value)}
      autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'name'}
    />
    {err && <p className="f-err">⚠ {err}</p>}
  </div>
)

import { useNavigate } from 'react-router-dom'

export default function PaymentPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('order_form')
    return saved ? JSON.parse(saved) : { name: '', email: '', phone: '' }
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [psReady, setPsReady] = useState(!!window.PaystackPop)

  useEffect(() => {
    localStorage.setItem('order_form', JSON.stringify(form))
  }, [form])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (!window.PaystackPop) {
      const s = document.createElement('script')
      s.src = 'https://js.paystack.co/v1/inline.js'
      s.onload = () => setPsReady(true)
      document.head.appendChild(s)
    }
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Please enter your full name'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Please enter a valid email address'
    if (!/^(\+234|0)[789]\d{9}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Nigerian number (e.g. 08012345678)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const pay = () => {
    if (!validate()) return
    if (!window.PaystackPop) {
      alert('Payment service is still loading, please wait a second and try again.')
      return
    }

    // Track Lead on Facebook when they click Pay
    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: CONFIG.BOOK_TITLE,
        value: CONFIG.PRICE_NAIRA,
        currency: 'NGN'
      })
    }

    setLoading(true)
    const ref = `n50k_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    try {
      const handler = window.PaystackPop.setup({
        key: CONFIG.PAYSTACK_PUBLIC_KEY,
        email: form.email.trim(),
        amount: CONFIG.PRICE_KOBO,
        currency: 'NGN',
        ref: ref,
        onSuccess: (transaction) => {
          // TRACK PURCHASE ON FACEBOOK
          if (window.fbq) {
            fbq('track', 'Purchase', {
              value: CONFIG.PRICE_NAIRA,
              currency: 'NGN',
              content_name: CONFIG.BOOK_TITLE
            })
          }

          // Save to database and navigate
          saveOrder({
            reference: transaction.reference,
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim()
          }).then(() => {
            const customerData = { ...form, ref: transaction.reference }
            localStorage.setItem('paid_customer', JSON.stringify(customerData))
            setLoading(false)
            navigate('/success')
          }).catch(err => {
            console.error('Database save error:', err)
            navigate('/success')
          })
        },
        onClose: () => {
          setLoading(false)
        },
        // Support older callback name just in case
        callback: (response) => {
          if (window.fbq) fbq('track', 'Purchase', { value: CONFIG.PRICE_NAIRA, currency: 'NGN', content_name: CONFIG.BOOK_TITLE });
          saveOrder({ reference: response.reference, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() }).then(() => {
            localStorage.setItem('paid_customer', JSON.stringify({ ...form, ref: response.reference }));
            navigate('/success');
          });
        }
      })
      handler.openIframe()
    } catch (err) {
      console.error('Paystack SDK error:', err)
      alert('Could not start payment. Please check your internet and refresh.')
      setLoading(false)
    }
  }

  const onBack = () => navigate('/')


  return (
    <>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, var(--g900), var(--g800))',
        color: '#fff', padding: '48px 0 40px',
      }}>
        <div className="wrap t-center">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', borderRadius: 50, padding: '6px 16px', marginBottom: 18, fontSize: '.8rem', fontWeight: 600 }}>
            🔒 Secure Checkout — Powered by Paystack
          </div>
          <h1 className="h1 t-white" style={{ marginBottom: 10 }}>Complete Your Order</h1>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '.95rem' }}>
            You're one step away from The N50K Blueprint
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 }}>
            {['🔒 SSL Encrypted', '⚡ Instant Access', '📩 Sent to Your Email'].map(t => (
              <span key={t} style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.55)', fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <section className="section-sm">
        <div className="wrap-n">

          {/* Order summary */}
          <div className="order-wrap" style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--n500)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: .5 }}>📦 Your Order</p>
            <div className="order-row">
              <div>
                <p style={{ fontWeight: 700 }}>📗 The N50K Blueprint (PDF)</p>
                <p style={{ fontSize: '.78rem', color: 'var(--n400)', marginTop: 2 }}>Complete 55-Page Guide + 4 Bonuses</p>
              </div>
              <span style={{ fontWeight: 700, color: 'var(--g700)', whiteSpace: 'nowrap' }}>₦2,500</span>
            </div>
            {['Supplier Directory', 'Caption Pack (30 posts)', '100-Day Action Plan', 'Free Tools Directory'].map(b => (
              <div key={b} className="order-row" style={{ color: 'var(--n500)', fontSize: '.84rem' }}>
                <span>📌 {b}</span>
                <span style={{ color: 'var(--g600)', fontWeight: 600 }}>FREE</span>
              </div>
            ))}
            <div className="order-row order-total">
              <strong>Total</strong>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--n400)', textDecoration: 'line-through', fontSize: '.8rem', fontWeight: 500 }}>₦9,000</div>
                <div style={{ fontWeight: 900, fontSize: '1.35rem', color: 'var(--g800)' }}>₦2,500</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', padding: '26px 22px', boxShadow: 'var(--sh)', border: '1.5px solid var(--n200)', marginBottom: 18 }}>
            <p style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--n500)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: .5 }}>👤 Your Details</p>

            <Field id="name" label="Full Name" type="text" placeholder="e.g. Chioma Adeyemi"
              val={form.name} err={errors.name} onChange={v => set('name', v)} />
            <Field id="email" label="Email Address" hint="(Download link sent here)"
              type="email" placeholder="e.g. chioma@gmail.com"
              val={form.email} err={errors.email} onChange={v => set('email', v)} />
            <Field id="phone" label="Phone Number" type="tel" placeholder="e.g. 08012345678"
              val={form.phone} err={errors.phone} onChange={v => set('phone', v)} />
          </div>

          {/* Pay button */}
          <button className="btn-cta" onClick={pay} disabled={loading}
            style={{ maxWidth: '100%', fontSize: '1.05rem', opacity: loading ? .82 : 1 }}>
            {loading
              ? <><span className="spinner" /><span>Processing...</span></>
              : <><span>🔒 Pay ₦2,500 Securely Now<span className="sub">Paystack · Cards · Transfer · USSD</span></span><span className="arrow">→</span></>
            }
          </button>


          {/* Guarantee */}
          <div className="guarantee" style={{ marginTop: 32 }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🛡️</div>
            <div className="guarantee-title">Instant & Permanent Access</div>
            <p className="guarantee-text">Your Blueprint is delivered to your email the moment payment is confirmed — tied to your account permanently. One payment, lifetime access.</p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20 }}>
            <button onClick={onBack} className="btn-ghost" style={{ color: 'var(--n500)' }}>
              ← Back to Sales Page
            </button>
          </p>
        </div>
      </section>

    </>
  )
}
