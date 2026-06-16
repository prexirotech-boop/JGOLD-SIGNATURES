import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, createEnrollment } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS = {
  paid:      { label: 'Paid',      bg: 'rgba(22,163,74,0.1)',   color: '#15803d', border: 'rgba(22,163,74,0.25)',  dot: '#22c55e',  icon: '✓' },
  pending:   { label: 'Pending',   bg: 'rgba(234,179,8,0.1)',   color: '#a16207', border: 'rgba(234,179,8,0.25)',  dot: '#eab308',  icon: '◷' },
  cancelled: { label: 'Cancelled', bg: 'rgba(239,68,68,0.08)',  color: '#b91c1c', border: 'rgba(239,68,68,0.15)',  dot: '#ef4444',  icon: '✕' },
  abandoned: { label: 'Abandoned', bg: 'rgba(100,116,139,0.1)', color: '#475569', border: 'rgba(100,116,139,0.2)', dot: '#94a3b8',  icon: '✕' },
  refunded:  { label: 'Refunded',  bg: 'rgba(220,38,38,0.09)',  color: '#dc2626', border: 'rgba(220,38,38,0.2)',   dot: '#ef4444',  icon: '↩' },
  failed:    { label: 'Failed',    bg: 'rgba(249,115,22,0.09)', color: '#c2410c', border: 'rgba(249,115,22,0.2)',  dot: '#f97316',  icon: '!' },
}

const PAY_METHODS = { paystack: 'Paystack', manual: 'Manual', bank: 'Bank Transfer', cash: 'Cash' }

const fmt    = n  => `₦${Number(n || 0).toLocaleString('en-NG')}`
const fmtD   = d  => d ? new Date(d).toLocaleDateString('en-NG',  { day:'2-digit', month:'short', year:'numeric' }) : '—'
const fmtDT  = d  => d ? new Date(d).toLocaleString ('en-NG',  { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
const idStr  = v  => String(v || '')  // safe stringify for any id type (int or uuid)
const truncR = (s, n=20) => (s||'').length > n ? (s||'').slice(0,n)+'…' : (s || 'N/A')

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

const StatusBadge = ({ status, size = 'md' }) => {
  const s = STATUS[status] || STATUS.failed
  const small = size === 'sm'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: small ? 4 : 5,
      padding: small ? '2px 8px' : '4px 10px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      borderRadius: 20, fontSize: small ? 10.5 : 11.5, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: small ? 5 : 6, height: small ? 5 : 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {s.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS CARD
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, accent = '#2563eb', onClick, active }) => (
  <button onClick={onClick} style={{
    background: active ? `linear-gradient(135deg, ${accent}18, ${accent}08)` : '#fff',
    border: active ? `2px solid ${accent}40` : '1.5px solid #e8ecf0',
    borderRadius: 16, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 6,
    boxShadow: active ? `0 4px 20px ${accent}15` : '0 1px 4px rgba(0,0,0,0.04)',
    cursor: onClick ? 'pointer' : 'default',
    textAlign: 'left', transition: 'all 0.2s', width: '100%',
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-1px)')}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = '')}
  >
    <div style={{ color: accent, marginBottom: 2 }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#8792a2', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: active ? accent : '#1a1f36', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11.5, color: '#a0aec0', marginTop: 1 }}>{sub}</div>}
  </button>
)

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM MODAL
// ─────────────────────────────────────────────────────────────────────────────

const ConfirmModal = ({ isOpen, title, message, confirmLabel, onConfirm, onCancel, variant = 'danger' }) => {
  if (!isOpen) return null
  const colors = { danger: '#dc2626', success: '#059669', warning: '#d97706' }
  const c = colors[variant] || colors.danger
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, padding: '32px 28px', boxShadow: '0 30px 60px rgba(0,0,0,0.25)', animation: 'fadeScale 0.18s ease' }}>
        <style>{`@keyframes fadeScale { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${c}12`, border: `2px solid ${c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
          {variant === 'danger' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          ) : variant === 'success' ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          )}
        </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 10px' }}>{title}</h3>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 24px', lineHeight: 1.65 }}>{message}</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '11px', background: c, border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

const Toast = ({ msg, type }) => {
  const colors = { success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }, error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' }, warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' } }
  const c = colors[type] || colors.success
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 24, zIndex: 10001, background: c.bg, border: `1.5px solid ${c.border}`, color: c.color, padding: '13px 20px', borderRadius: 14, fontWeight: 600, fontSize: 13.5, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', maxWidth: 380, animation: 'slideUp 0.25s ease' }}>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
      {msg}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

const DSection = ({ title, children }) => (
  <div>
    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid #f1f5f9' }}>{title}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</div>
  </div>
)

const DRow = ({ label, value, mono, accent }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
    <span style={{ fontSize: 12.5, color: '#94a3b8', fontWeight: 500, flexShrink: 0, lineHeight: 1.4 }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: accent || '#1a1f36', textAlign: 'right', wordBreak: 'break-all', fontFamily: mono ? 'monospace' : undefined, lineHeight: 1.4 }}>{value || '—'}</span>
  </div>
)

const DAction = ({ children, color, icon, onClick }) => {
  const isPrimary = color === '#059669' || color === '#2563eb'
  const bg = isPrimary ? color : '#fff'
  const textCol = isPrimary ? '#fff' : color
  const borderCol = isPrimary ? 'transparent' : `${color}30`

  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '12px 16px', background: bg, color: textCol, border: `1.5px solid ${borderCol}`,
      borderRadius: 10, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: isPrimary ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
    }}
      onMouseEnter={e => {
        if (isPrimary) {
          e.currentTarget.style.filter = 'brightness(0.92)'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
        } else {
          e.currentTarget.style.background = `${color}10`
          e.currentTarget.style.borderColor = color
        }
      }}
      onMouseLeave={e => {
        if (isPrimary) {
          e.currentTarget.style.filter = 'none'
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)'
        } else {
          e.currentTarget.style.background = '#fff'
          e.currentTarget.style.borderColor = `${color}30`
        }
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', fontSize: '1.1rem' }}>{icon}</span>
      <span>{children}</span>
    </button>
  )
}

function OrderDrawer({ order, onClose, onStatusChange, onEnroll }) {
  if (!order) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: '100%', maxWidth: 480,
        background: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 48px rgba(0,0,0,0.18)',
        animation: 'drawerIn 0.22s ease',
      }}>
        <style>{`@keyframes drawerIn { from { transform:translateX(100%); } to { transform:translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Order Details</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', fontFamily: 'monospace' }}>{truncR(order.reference, 24)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Hero amount card */}
        <div style={{ padding: '18px 22px', background: '#fafbff', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{fmt(order.amount)}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{fmtDT(order.created_at)}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DSection title="Customer">
            <DRow label="Name"  value={order.customer_name} />
            <DRow label="Email" value={order.customer_email} />
            <DRow label="Phone" value={order.customer_phone} />
          </DSection>

          <DSection title="Product">
            <DRow label="Title" value={(order.products?.title || 'Unknown').replace(/\s+slug$/i,'')} />
            <DRow label="Type"  value={order.products?.type} />
          </DSection>

          <DSection title="Payment">
            <DRow label="Amount"    value={fmt(order.amount)} accent="#0f172a" />
            <DRow label="Currency"  value={order.currency || 'NGN'} />
            <DRow label="Method"    value={PAY_METHODS[order.payment_method] || order.payment_method} />
            <DRow label="Reference" value={order.reference} mono />
            <DRow label="Order ID"  value={idStr(order.id)} mono />
          </DSection>

          <DSection title="Actions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(order.status === 'pending' || order.status === 'abandoned' || order.status === 'cancelled') &&
                <DAction color="#059669" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} onClick={() => onStatusChange(order, 'paid')}>Mark as Paid & Grant Access</DAction>}
              {order.status === 'paid' && order.products?.type === 'course' &&
                <DAction color="#2563eb" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>} onClick={() => onEnroll(order)}>Re-Grant Course Access</DAction>}
              {order.status === 'paid' &&
                <DAction color="#dc2626" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>} onClick={() => onStatusChange(order, 'refunded')}>Process Refund & Revoke Access</DAction>}
              {order.status === 'refunded' &&
                <DAction color="#059669" icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>} onClick={() => onStatusChange(order, 'paid')}>Reinstate (Re-mark as Paid)</DAction>}
            </div>
          </DSection>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE ORDER MODAL
// ─────────────────────────────────────────────────────────────────────────────

function CreateOrderModal({ isOpen, onClose, products, onCreated }) {
  const [form, setForm] = useState({ customer_email: '', customer_name: '', customer_phone: '', product_id: '', amount: '', reference: '', status: 'paid', payment_method: 'manual' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleProductChange = pid => {
    const p = products.find(x => x.id === pid)
    setForm(f => ({ ...f, product_id: pid, amount: p ? p.price : f.amount }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.customer_email.trim() || !form.product_id || !form.amount) { setError('Customer email, product, and amount are required.'); return }
    setSubmitting(true); setError('')
    const ref = form.reference.trim() || `MANUAL_${Date.now().toString(36).toUpperCase()}`
    try {
      const { error: insertErr } = await supabase.from('orders').insert({
        reference: ref, customer_email: form.customer_email.trim().toLowerCase(),
        customer_name: form.customer_name.trim() || null, customer_phone: form.customer_phone.trim() || null,
        product_id: form.product_id, amount: parseInt(form.amount), currency: 'NGN',
        status: form.status, payment_method: form.payment_method,
      })
      if (insertErr) { setError(insertErr.code === '23505' ? 'This reference already exists.' : insertErr.message); return }
      if (form.status === 'paid') {
        const { data: prod } = await supabase.from('products').select('type').eq('id', form.product_id).single()
        if (prod?.type === 'course') {
          const { data: profile } = await supabase.from('profiles').select('id').eq('email', form.customer_email.trim().toLowerCase()).maybeSingle()
          if (profile) await createEnrollment({ userId: profile.id, courseId: form.product_id })
        }
      }
      onCreated(); onClose()
      setForm({ customer_email: '', customer_name: '', customer_phone: '', product_id: '', amount: '', reference: '', status: 'paid', payment_method: 'manual' })
    } catch (err) { setError(err.message || 'An unexpected error occurred.')
    } finally { setSubmitting(false) }
  }

  if (!isOpen) return null

  const inp = { width: '100%', padding: '10px 13px', borderRadius: 9, border: '1.5px solid #e2e8f0', fontSize: 13.5, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff', transition: 'border-color 0.18s' }
  const lbl = { display: 'block', fontWeight: 700, fontSize: 12, marginBottom: 6, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 30px 60px rgba(0,0,0,0.22)' }}>
        <div style={{ padding: '22px 26px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>Record New Order</h3>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>Create a manual order and optionally grant course access</p>
            </div>
            <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '0 26px 26px', display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Email *</label><input type="email" value={form.customer_email} onChange={e => setF('customer_email', e.target.value)} style={inp} placeholder="student@email.com" required onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
            <div><label style={lbl}>Full Name</label><input type="text" value={form.customer_name} onChange={e => setF('customer_name', e.target.value)} style={inp} placeholder="John Doe" onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
          </div>
          <div><label style={lbl}>Phone Number</label><input type="tel" value={form.customer_phone} onChange={e => setF('customer_phone', e.target.value)} style={inp} placeholder="08012345678" onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
          <div>
            <label style={lbl}>Product *</label>
            <select value={form.product_id} onChange={e => handleProductChange(e.target.value)} style={{ ...inp, cursor: 'pointer' }} required>
              <option value="">Select product…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title.replace(/\s+slug$/i,'')} — {fmt(p.price)}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={lbl}>Amount (NGN) *</label><input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} style={inp} placeholder="10000" required min="0" onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
            <div>
              <label style={lbl}>Payment Method</label>
              <select value={form.payment_method} onChange={e => setF('payment_method', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {Object.entries(PAY_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Reference / Transaction ID</label><input type="text" value={form.reference} onChange={e => setF('reference', e.target.value)} style={inp} placeholder="Auto-generated if left empty" onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#e2e8f0'} /></div>
          <div>
            <label style={lbl}>Order Status</label>
            <select value={form.status} onChange={e => setF('status', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="paid">Paid — Auto-grants course access</option>
              <option value="pending">Pending — No access yet</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="submit" disabled={submitting} style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '13px', borderRadius: 10, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Recording…' : '✓ Record Order'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#f8fafc', color: '#4f566b', border: '1.5px solid #e2e8f0', padding: '13px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE ORDER CARD
// ─────────────────────────────────────────────────────────────────────────────

const MobileOrderCard = ({ order, onClick }) => (
  <button onClick={onClick} style={{ width: '100%', background: '#fff', border: '1.5px solid #e8ecf0', borderRadius: 16, padding: '16px 18px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.18s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,99,235,0.1)'; e.currentTarget.style.borderColor = '#bfdbfe' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = '#e8ecf0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12.5, color: '#1a1f36' }}>{truncR(order.reference, 22)}</div>
      <StatusBadge status={order.status} size="sm" />
    </div>
    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 3 }}>{order.customer_name || 'Anonymous'}</div>
    <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 10 }}>{order.customer_email}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 }}>{(order.products?.title || 'Unknown').replace(/\s+slug$/i,'').slice(0,28)}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtD(order.created_at)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>{fmt(order.amount)}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    </div>
  </button>
)

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminOrders() {
  const [orders, setOrders]       = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast]         = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false })
  const toastTimer = useRef(null)

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current)
    setToast({ msg, type })
    toastTimer.current = setTimeout(() => setToast(null), 3500)
  }
  const showConfirm = opts => setConfirmModal({ isOpen: true, ...opts })
  const hideConfirm = () => setConfirmModal(m => ({ ...m, isOpen: false }))

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: ords }, { data: prods }] = await Promise.all([
        supabase.from('orders').select(`
          id, reference, customer_email, customer_name, customer_phone,
          amount, currency, status, payment_method, product_id, created_at,
          products ( id, title, type )
        `).order('created_at', { ascending: false }),
        supabase.from('products').select('id, title, price, type'),
      ])
      if (ords)  setOrders(ords)
      if (prods) setProducts(prods)
    } catch (err) {
      showToast('Failed to load orders from database', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Status Change ─────────────────────────────────────────────────────────
  const handleStatusChange = (order, newStatus) => {
    const isPaid = newStatus === 'paid'
    const isRefund = newStatus === 'refunded'
    showConfirm({
      title: isPaid ? 'Mark as Paid' : isRefund ? 'Process Refund' : `Change to ${newStatus}`,
      message: isPaid
        ? `Mark order from "${order.customer_name || order.customer_email}" as Paid? Course access will be granted automatically.`
        : isRefund
        ? `Refund "${order.customer_name || order.customer_email}"? Their course access will be revoked.`
        : `Change status to "${newStatus}"?`,
      confirmLabel: isPaid ? 'Mark as Paid' : isRefund ? 'Refund' : 'Confirm',
      variant: isPaid ? 'success' : isRefund ? 'danger' : 'warning',
      onConfirm: async () => {
        hideConfirm()
        try {
          const updateFields = { status: newStatus }
          if (newStatus === 'paid') updateFields.paid_at = new Date().toISOString()
          await supabase.from('orders').update(updateFields).eq('id', order.id)
          if (isPaid && order.products?.type === 'course' && order.product_id) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('email', order.customer_email).maybeSingle()
            if (profile) await createEnrollment({ userId: profile.id, courseId: order.product_id })
            showToast(`✅ Paid & course access granted to ${order.customer_email}`)
          } else if (isRefund && order.products?.type === 'course' && order.product_id) {
            const { data: profile } = await supabase.from('profiles').select('id').eq('email', order.customer_email).maybeSingle()
            if (profile) await supabase.from('enrollments').delete().eq('user_id', profile.id).eq('course_id', order.product_id)
            showToast('↩ Refund processed & access revoked', 'warning')
          } else {
            showToast(`Order status updated to ${newStatus}`)
          }
          await loadData()
          if (selectedOrder?.id === order.id) setSelectedOrder(prev => ({ ...prev, status: newStatus }))
        } catch (err) {
          showToast('Failed to update order status', 'error')
        }
      },
    })
  }

  const handleEnroll = order => {
    showConfirm({
      title: 'Re-Grant Course Access',
      message: `Create enrollment for ${order.customer_name || order.customer_email} in "${(order.products?.title||'').replace(/\s+slug$/i,'')}"?`,
      confirmLabel: '🎓 Grant Access',
      variant: 'success',
      onConfirm: async () => {
        hideConfirm()
        try {
          const { data: profile } = await supabase.from('profiles').select('id').eq('email', order.customer_email).maybeSingle()
          if (!profile) { showToast('No user account found — they must sign up first.', 'error'); return }
          const ok = await createEnrollment({ userId: profile.id, courseId: order.product_id })
          showToast(ok ? `✅ Course access granted to ${order.customer_email}` : 'Enrollment failed — check DB permissions.', ok ? 'success' : 'error')
        } catch { showToast('Unexpected error granting access.', 'error') }
      },
    })
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ['Reference','Customer Name','Email','Phone','Product','Amount','Currency','Status','Method','Date'],
      ...filteredOrders.map(o => [
        o.reference||'', o.customer_name||'', o.customer_email||'', o.customer_phone||'',
        (o.products?.title||'').replace(/\s+slug$/i,''), o.amount||0, o.currency||'NGN',
        o.status||'', o.payment_method||'', fmtD(o.created_at),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type:'text/csv' })), download: `orders_${Date.now()}.csv` })
    a.click()
    showToast('CSV exported successfully')
  }

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    const s = search.toLowerCase()
    const match = !s || [(o.reference||''),(o.customer_email||''),(o.customer_name||''),(o.products?.title||'')].some(v => v.toLowerCase().includes(s))
    const ms = statusFilter === 'all' || o.status === statusFilter
    const d = o.created_at ? new Date(o.created_at) : null
    const mf = !dateFrom || (d && d >= new Date(dateFrom))
    const mt = !dateTo   || (d && d <= new Date(dateTo + 'T23:59:59'))
    return match && ms && mf && mt
  })

  // ── Stats ─────────────────────────────────────────────────────────────────
  const revenue   = orders.filter(o => o.status === 'paid').reduce((a, o) => a + (o.amount||0), 0)
  const st = Object.fromEntries(Object.keys(STATUS).map(k => [k, orders.filter(o => o.status === k).length]))
  const hasFilter = search || statusFilter !== 'all' || dateFrom || dateTo

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: 'var(--font, system-ui, sans-serif)', maxWidth: '100%' }}>
      <style>{`
        @media (max-width: 767px) { 
          .orders-desktop-table { display:none !important; } 
          .ao-filter-control {
            flex: 1 !important;
            min-width: 130px !important;
          }
        }
        @media (min-width: 768px) { .orders-mobile-cards { display:none !important; } }
        
        .ao-filter-control {
          padding: 10px 14px !important;
          border-radius: 9px !important;
          border: 1.5px solid #e2e8f0 !important;
          font-size: 13.5px !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
          color: #0f172a !important;
          outline: none !important;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .ao-filter-control:hover {
          border-color: #cbd5e1 !important;
        }
        .ao-filter-control:focus {
          border-color: #2563eb !important;
          box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.12) !important;
        }
        .ao-filter-search {
          width: 100% !important;
          padding-left: 14px !important;
          cursor: text !important;
        }
        .ao-filter-control::placeholder {
          color: #94a3b8 !important;
        }
      `}</style>

      {/* Modals */}
      <ConfirmModal {...confirmModal} onCancel={hideConfirm} />
      {selectedOrder && <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)}
        onStatusChange={(o,s)=>{ setSelectedOrder(null); handleStatusChange(o,s) }}
        onEnroll={o=>{ setSelectedOrder(null); handleEnroll(o) }} />}
      <CreateOrderModal isOpen={showCreate} onClose={() => setShowCreate(false)} products={products}
        onCreated={() => { loadData(); showToast('Order recorded successfully') }} />
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 3px' }}>Orders</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: 13.5 }}>
            {loading ? 'Loading…' : `${filteredOrders.length.toLocaleString()} order${filteredOrders.length !== 1 ? 's' : ''}`}
            {statusFilter !== 'all' ? ` · ${STATUS[statusFilter]?.label}` : ''}
            {!loading && ` · Revenue: ${fmt(filteredOrders.filter(o=>o.status==='paid').reduce((a,o)=>a+(o.amount||0),0))}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background='#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 9, fontWeight: 700, cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Record Order
          </button>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────────── */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>} label="Revenue" value={fmt(revenue)} sub={`${st.paid||0} paid orders`} accent="#2563eb" onClick={()=>setStatusFilter('all')} active={statusFilter==='all'} />
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>} label="Total" value={orders.length} sub="all orders" accent="#7c3aed" onClick={()=>setStatusFilter('all')} active={false} />
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>} label="Paid" value={st.paid||0} sub="completed" accent="#059669" onClick={()=>setStatusFilter(statusFilter==='paid'?'all':'paid')} active={statusFilter==='paid'} />
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} label="Pending" value={st.pending||0} sub="awaiting payment" accent="#d97706" onClick={()=>setStatusFilter(statusFilter==='pending'?'all':'pending')} active={statusFilter==='pending'} />
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} label="Cancelled" value={st.cancelled||0} sub="user cancelled" accent="#ef4444" onClick={()=>setStatusFilter(statusFilter==='cancelled'?'all':'cancelled')} active={statusFilter==='cancelled'} />
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>} label="Refunded" value={st.refunded||0} sub="processed" accent="#dc2626" onClick={()=>setStatusFilter(statusFilter==='refunded'?'all':'refunded')} active={statusFilter==='refunded'} />
          <StatCard icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>} label="Abandoned" value={st.abandoned||0} sub="dropped" accent="#64748b" onClick={()=>setStatusFilter(statusFilter==='abandoned'?'all':'abandoned')} active={statusFilter==='abandoned'} />
        </div>
      )}

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input type="text" className="ao-filter-control ao-filter-search" placeholder="Search reference, email, name…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:4 }}>✕</button>}
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="ao-filter-control">
          <option value="all">All Statuses</option>
          {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <input 
          type={dateFrom ? "date" : "text"} 
          placeholder="From Date" 
          value={dateFrom} 
          onFocus={(e) => e.target.type = 'date'} 
          onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }} 
          onChange={e=>setDateFrom(e.target.value)} 
          className="ao-filter-control" 
        />
        <input 
          type={dateTo ? "date" : "text"} 
          placeholder="To Date" 
          value={dateTo} 
          onFocus={(e) => e.target.type = 'date'} 
          onBlur={(e) => { if (!e.target.value) e.target.type = 'text' }} 
          onChange={e=>setDateTo(e.target.value)} 
          className="ao-filter-control" 
        />
        {hasFilter && (
          <button onClick={()=>{setSearch('');setStatusFilter('all');setDateFrom('');setDateTo('')}} style={{ padding:'10px 14px', borderRadius:9, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            ✕ Clear
          </button>
        )}
        <button onClick={loadData} style={{ padding:'10px 13px', borderRadius:9, border:'1.5px solid #e2e8f0', background:'#fff', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Refresh
        </button>
      </div>

      {/* ── Table (desktop) ─────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ background:'#fff', border:'1.5px solid #e8ecf0', borderRadius:16, padding:'70px 24px', textAlign:'center' }}>
          <div style={{ width:36, height:36, border:'3px solid #e2e8f0', borderTop:'3px solid #2563eb', borderRadius:'50%', animation:'ao-spin 0.7s linear infinite', margin:'0 auto 16px' }} />
          <div style={{ color:'#64748b', fontSize:14, fontWeight:500 }}>Loading orders from database…</div>
          <style>{`@keyframes ao-spin { to { transform:rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="orders-desktop-table" style={{ background:'#fff', border:'1.5px solid #e8ecf0', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', textAlign:'left', borderCollapse:'collapse', minWidth:780 }}>
                <thead>
                  <tr style={{ background:'linear-gradient(135deg,#f8fafc,#f1f5f9)', borderBottom:'1.5px solid #e8ecf0' }}>
                    {['Reference','Customer','Product','Amount','Status','Method','Date',''].map(h => (
                      <th key={h} style={{ padding:'13px 18px', color:'#64748b', fontSize:11, textTransform:'uppercase', fontWeight:800, letterSpacing:0.6, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan="8" style={{ padding:'60px 24px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>
                      {hasFilter ? 'No orders match your current filters.' : 'No orders recorded yet. Use "Record Order" to add one manually.'}
                    </td></tr>
                  ) : filteredOrders.map(o => (
                    <tr key={idStr(o.id)} onClick={() => setSelectedOrder(o)}
                      style={{ borderBottom:'1px solid #f8fafc', cursor:'pointer', transition:'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding:'14px 18px' }}>
                        <div style={{ fontWeight:700, color:'#1a1f36', fontSize:12.5, fontFamily:'monospace', whiteSpace:'nowrap' }}>{truncR(o.reference, 20)}</div>
                        <div style={{ fontSize:11, color:'#c4ccd8', marginTop:2 }}>#{idStr(o.id).slice(0,8)}</div>
                      </td>
                      <td style={{ padding:'14px 18px' }}>
                        <div style={{ fontWeight:700, color:'#1a1f36', fontSize:13.5 }}>{o.customer_name || 'Anonymous'}</div>
                        <div style={{ fontSize:12, color:'#8792a2' }}>{o.customer_email}</div>
                      </td>
                      <td style={{ padding:'14px 18px', maxWidth:180 }}>
                        <div style={{ fontWeight:600, color:'#334155', fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{(o.products?.title||'Unknown').replace(/\s+slug$/i,'')}</div>
                        {o.products?.type && <div style={{ fontSize:10.5, color:'#b0b8c9', marginTop:2, textTransform:'uppercase', fontWeight:700, letterSpacing:0.4 }}>{o.products.type}</div>}
                      </td>
                      <td style={{ padding:'14px 18px', fontWeight:900, fontSize:14.5, color:'#0f172a', whiteSpace:'nowrap' }}>{fmt(o.amount)}</td>
                      <td style={{ padding:'14px 18px' }}><StatusBadge status={o.status} /></td>
                      <td style={{ padding:'14px 18px', fontSize:12.5, color:'#64748b', whiteSpace:'nowrap' }}>{PAY_METHODS[o.payment_method] || o.payment_method || '—'}</td>
                      <td style={{ padding:'14px 18px', fontSize:12.5, color:'#64748b', whiteSpace:'nowrap' }}>{fmtD(o.created_at)}</td>
                      <td style={{ padding:'14px 18px' }}>
                        <div style={{ width:28, height:28, borderRadius:7, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            {filteredOrders.length > 0 && (
              <div style={{ padding:'12px 20px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fafbff', flexWrap:'wrap', gap:8 }}>
                <span style={{ fontSize:12.5, color:'#64748b' }}>
                  Showing <strong style={{ color:'#1a1f36' }}>{filteredOrders.length}</strong> of <strong style={{ color:'#1a1f36' }}>{orders.length}</strong> orders
                  {' · '}Filtered revenue: <strong style={{ color:'#059669' }}>{fmt(filteredOrders.filter(o=>o.status==='paid').reduce((a,o)=>a+(o.amount||0),0))}</strong>
                </span>
                <span style={{ fontSize:12, color:'#94a3b8' }}>Click any row to view details</span>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="orders-mobile-cards" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 24px', color:'#94a3b8', fontSize:14, background:'#fff', borderRadius:16, border:'1.5px solid #e8ecf0' }}>
                {hasFilter ? 'No orders match your current filters.' : 'No orders recorded yet.'}
              </div>
            ) : filteredOrders.map(o => (
              <MobileOrderCard key={idStr(o.id)} order={o} onClick={() => setSelectedOrder(o)} />
            ))}
            {filteredOrders.length > 0 && (
              <div style={{ textAlign:'center', padding:'10px 0', fontSize:12.5, color:'#94a3b8' }}>
                {filteredOrders.length} orders · Tap any card to view details
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
