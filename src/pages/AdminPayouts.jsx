import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (kobo) =>
  (Number(kobo || 0) / 100).toLocaleString('en-NG', {
    style: 'currency',
    currency: 'NGN',
  })

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-NG', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—'

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PAYOUT_METHODS = [
  'Bank Transfer',
  'PayPal',
  'Flutterwave',
  'Paystack',
  'Cash',
  'Crypto',
  'Other',
]

const PAYOUT_STATUS = {
  pending: {
    label: 'Pending',
    bg: 'rgba(234,179,8,0.1)',
    color: '#a16207',
    border: 'rgba(234,179,8,0.3)',
    dot: '#eab308',
  },
  processing: {
    label: 'Processing',
    bg: 'rgba(59,130,246,0.1)',
    color: '#1d4ed8',
    border: 'rgba(59,130,246,0.3)',
    dot: '#3b82f6',
  },
  paid: {
    label: 'Paid',
    bg: 'rgba(22,163,74,0.1)',
    color: '#15803d',
    border: 'rgba(22,163,74,0.3)',
    dot: '#22c55e',
  },
  failed: {
    label: 'Failed',
    bg: 'rgba(239,68,68,0.08)',
    color: '#b91c1c',
    border: 'rgba(239,68,68,0.2)',
    dot: '#ef4444',
  },
}

const COMMISSION_STATUS = {
  pending: { label: 'Pending', color: '#a16207', bg: 'rgba(234,179,8,0.1)', dot: '#eab308', border: 'rgba(234,179,8,0.3)' },
  approved: { label: 'Approved', color: '#15803d', bg: 'rgba(22,163,74,0.1)', dot: '#22c55e', border: 'rgba(22,163,74,0.3)' },
  paid: { label: 'Paid', color: '#6d28d9', bg: 'rgba(109,40,217,0.1)', dot: '#8b5cf6', border: 'rgba(109,40,217,0.2)' },
  rejected: { label: 'Rejected', color: '#b91c1c', bg: 'rgba(239,68,68,0.08)', dot: '#ef4444', border: 'rgba(239,68,68,0.2)' },
}

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────

function Toast({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: t.type === 'error' ? '#fee2e2' : '#f0fdf4',
            border: `1.5px solid ${t.type === 'error' ? '#fca5a5' : '#bbf7d0'}`,
            borderLeft: `4px solid ${t.type === 'error' ? '#ef4444' : '#22c55e'}`,
            color: t.type === 'error' ? '#991b1b' : '#14532d',
            padding: '12px 18px',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            minWidth: 280,
            maxWidth: 380,
            pointerEvents: 'all',
            animation: 'slideInToast 0.3s ease',
          }}
        >
          <span style={{ fontSize: 18 }}>{t.type === 'error' ? '✕' : '✓'}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: 'inherit',
              opacity: 0.6,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`@keyframes slideInToast{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}`}</style>
    </div>
  )
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, message, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000)
  }, [])
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), [])
  return { toasts, add, remove }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function Badge({ status, map }) {
  const cfg = map[status] || {
    label: status,
    bg: 'rgba(100,116,139,0.1)',
    color: '#475569',
    border: 'rgba(100,116,139,0.2)',
    dot: '#94a3b8',
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border || cfg.bg}`,
        whiteSpace: 'nowrap',
        letterSpacing: 0.3,
      }}
    >
      {cfg.dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cfg.dot,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}
      {cfg.label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ url, name, size = 40 }) {
  const [err, setErr] = useState(false)
  const colors = [
    'linear-gradient(135deg,#6366f1,#8b5cf6)',
    'linear-gradient(135deg,#3b82f6,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#10b981,#3b82f6)',
    'linear-gradient(135deg,#ec4899,#f43f5e)',
  ]
  const bg = colors[(name || '').charCodeAt(0) % colors.length]
  if (url && !err) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setErr(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        letterSpacing: 0.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {initials(name) || '?'}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function PayoutModal({ affiliateGroup, onClose, onSuccess }) {
  const { affiliate, commissions } = affiliateGroup
  const profile = affiliate?.profiles
  const name = profile?.full_name || 'Unknown'

  const [selectedIds, setSelectedIds] = useState(() => commissions.map((c) => c.id))
  const [method, setMethod] = useState('Bank Transfer')
  const [txRef, setTxRef] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selected = commissions.filter((c) => selectedIds.includes(c.id))
  const totalAmount = selected.reduce((sum, c) => sum + (c.commission_amount || 0), 0)

  const toggleAll = () => {
    if (selectedIds.length === commissions.length) setSelectedIds([])
    else setSelectedIds(commissions.map((c) => c.id))
  }

  const toggleOne = (id) => {
    setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const handleSubmit = async () => {
    if (!selectedIds.length) { setError('Select at least one commission.'); return }
    if (!txRef.trim()) { setError('Transaction reference is required.'); return }
    setError('')
    setSubmitting(true)

    try {
      // 1. Create payout record
      const { data: payout, error: payoutErr } = await supabase
        .from('affiliate_payouts')
        .insert({
          affiliate_id: affiliate.id,
          amount: totalAmount,
          commission_ids: selectedIds,
          status: 'paid',
          payout_method: method,
          transaction_ref: txRef.trim(),
          notes: notes.trim() || null,
          paid_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (payoutErr) throw payoutErr

      // 2. Mark commissions as paid
      const { error: commErr } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'paid', payout_id: payout.id })
        .in('id', selectedIds)

      if (commErr) throw commErr

      // 3. Update affiliate total_paid
      const { error: affErr } = await supabase
        .from('affiliates')
        .update({ total_paid: (affiliate.total_paid || 0) + totalAmount })
        .eq('id', affiliate.id)

      if (affErr) throw affErr

      onSuccess()
    } catch (err) {
      console.error('[PayoutModal] Error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10,15,40,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 660,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(135deg,#1a1f36 0%,#252d5e 100%)',
            borderRadius: '20px 20px 0 0',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar url={profile?.avatar_url} name={name} size={44} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>{name}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                  {profile?.email}&nbsp;&nbsp;·&nbsp;&nbsp;
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      padding: '1px 8px',
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 600,
                    }}
                  >
                    {affiliate?.affiliate_code}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                width: 34,
                height: 34,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Amount summary */}
          <div
            style={{
              marginTop: 18,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Selected Payout Total
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>{fmt(totalAmount)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 3 }}>
                {selectedIds.length} of {commissions.length} commissions
              </div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                Rate: {affiliate?.commission_rate ?? '—'}%
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', flex: 1, overflowY: 'auto' }}>
          {/* Commissions list */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1f36' }}>
                Pending Commissions
              </div>
              <button
                onClick={toggleAll}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  color: '#6366f1',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                {selectedIds.length === commissions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div
              style={{
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {commissions.map((c, i) => {
                const checked = selectedIds.includes(c.id)
                return (
                  <label
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '13px 16px',
                      cursor: 'pointer',
                      borderBottom: i < commissions.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: checked ? 'rgba(99,102,241,0.04)' : '#fff',
                      transition: 'background 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(c.id)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6366f1' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1a1f36',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {c.order_reference || c.order_id || `Commission #${c.id}`}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#15803d', flexShrink: 0 }}>
                          {fmt(c.commission_amount)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span>{fmtDate(c.created_at)}</span>
                        <Badge status={c.status} map={COMMISSION_STATUS} />
                        {c.order_amount && (
                          <span>Order: {fmt(c.order_amount)}</span>
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Payout form */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 14,
              padding: 20,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1f36', marginBottom: 16 }}>
              Payout Details
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#64748b',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Payout Method *
                </label>
                <CustomSelect
                  value={method}
                  onChange={setMethod}
                  options={PAYOUT_METHODS.map((m) => ({ value: m, label: m }))}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#64748b',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Transaction Reference *
                </label>
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. TXN-20240617-001"
                  style={{
                    width: '100%',
                    border: `1.5px solid ${error && !txRef.trim() ? '#ef4444' : '#cbd5e1'}`,
                    borderRadius: 9,
                    padding: '9px 12px',
                    fontSize: 14,
                    color: '#1a1f36',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: '#64748b',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this payout…"
                rows={3}
                style={{
                  width: '100%',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 9,
                  padding: '9px 12px',
                  fontSize: 14,
                  color: '#1a1f36',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                color: '#b91c1c',
                fontSize: 13.5,
                fontWeight: 500,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 6 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '18px 28px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: '#fafbfc',
            borderRadius: '0 0 20px 20px',
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {selectedIds.length > 0 ? (
              <>
                Paying out{' '}
                <strong style={{ color: '#1a1f36' }}>{fmt(totalAmount)}</strong>
                {' '}across {selectedIds.length} commission{selectedIds.length !== 1 ? 's' : ''}
              </>
            ) : (
              <span style={{ color: '#ef4444' }}>No commissions selected</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                background: '#fff',
                color: '#475569',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedIds.length}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background:
                  submitting || !selectedIds.length
                    ? '#c7d2fe'
                    : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting || !selectedIds.length ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow:
                  submitting || !selectedIds.length
                    ? 'none'
                    : '0 4px 14px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTop: '2px solid #fff',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Processing…
                </>
              ) : (
                <>✓ Confirm Payout {fmt(totalAmount)}</>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM SELECT COMPONENT & HOOK
// ─────────────────────────────────────────────────────────────────────────────

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function CustomSelect({ value, onChange, options, minWidth = '100%' }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  
  useClickOutside(containerRef, () => setIsOpen(false))

  const selectedOption = options.find(opt => opt.value === value)

  return (
    <div ref={containerRef} style={{ position: 'relative', width: minWidth }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '9px 12px',
          borderRadius: 9,
          border: isOpen ? '1.5px solid #6366f1' : '1.5px solid #cbd5e1',
          fontSize: '14px',
          color: '#1a1f36',
          backgroundColor: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'all 0.15s',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none',
        }}
      >
        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
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
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
            maxHeight: '220px',
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
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                  color: isSelected ? '#1e40af' : '#1a1f36',
                  fontSize: '13.5px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  textAlign: 'left',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                {opt.label}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, gradient }) {
  return (
    <div
      style={{
        background: gradient || 'linear-gradient(135deg,#6366f1,#4f46e5)',
        borderRadius: 16,
        padding: '20px 22px',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: '0 6px 24px rgba(99,102,241,0.2)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          opacity: 0.08,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.75,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PENDING COMMISSIONS TAB
// ─────────────────────────────────────────────────────────────────────────────

function PendingTab({ groups, loading, onCreatePayout }) {
  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading pending commissions…</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!groups.length) {
    return (
      <div
        style={{
          padding: '70px 40px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: 16,
          border: '1.5px dashed #e2e8f0',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', marginBottom: 16 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1f36', marginBottom: 8 }}>
          All Caught Up!
        </div>
        <div style={{ color: '#94a3b8', fontSize: 14, maxWidth: 320, margin: '0 auto' }}>
          There are no pending or approved commissions awaiting payout. Check back later.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {groups.map((group) => {
        const aff = group.affiliate
        const profile = aff?.profiles
        const name = profile?.full_name || 'Unknown Affiliate'
        return (
          <div
            key={aff?.id}
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1.5px solid #e8edf5',
              padding: '20px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s, transform 0.2s',
              flexWrap: 'wrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Avatar url={profile?.avatar_url} name={name} size={50} />

            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: '#1a1f36', marginBottom: 2 }}>
                {name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span>{profile?.email}</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    color: '#6366f1',
                    padding: '1px 8px',
                    borderRadius: 20,
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    fontFamily: 'monospace',
                  }}
                >
                  {aff?.affiliate_code}
                </span>
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '0 18px',
                borderLeft: '1px solid #f1f5f9',
                borderRight: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: '#94a3b8',
                  marginBottom: 3,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Commissions
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1f36' }}>
                {group.commissions.length}
              </div>
            </div>

            <div style={{ textAlign: 'right', padding: '0 0 0 12px', minWidth: 130 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: '#94a3b8',
                  marginBottom: 3,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Amount Owed
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>
                {fmt(group.totalAmount)}
              </div>
            </div>

            <button
              onClick={() => onCreatePayout(group)}
              style={{
                marginLeft: 8,
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)'
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'text-bottom', marginRight: 6 }}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" />
              </svg>
              Create Payout
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYOUT HISTORY TAB
// ─────────────────────────────────────────────────────────────────────────────

function HistoryTab({ payouts, loading, filter, onFilterChange }) {
  const filtered =
    filter === 'all' ? payouts : payouts.filter((p) => p.status === filter)

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading payout history…</div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginRight: 4 }}>
          Filter by status:
        </span>
        {['all', 'pending', 'processing', 'paid', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: `1.5px solid ${filter === s ? '#6366f1' : '#e2e8f0'}`,
              background: filter === s ? '#6366f1' : '#fff',
              color: filter === s ? '#fff' : '#475569',
              fontWeight: 600,
              fontSize: 12.5,
              cursor: 'pointer',
              transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {s === 'all' ? 'All' : PAYOUT_STATUS[s]?.label || s}
          </button>
        ))}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 12.5,
            color: '#94a3b8',
            fontWeight: 500,
          }}
        >
          {filtered.length} record{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {!filtered.length ? (
        <div
          style={{
            padding: '60px 40px',
            textAlign: 'center',
            background: '#fff',
            borderRadius: 16,
            border: '1.5px dashed #e2e8f0',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: '50%', background: '#f8fafc', color: '#64748b', marginBottom: 14 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#1a1f36', marginBottom: 6 }}>
            No Payouts Found
          </div>
          <div style={{ color: '#94a3b8', fontSize: 13.5 }}>
            {filter === 'all'
              ? 'No payouts have been recorded yet.'
              : `No payouts with status "${PAYOUT_STATUS[filter]?.label || filter}" found.`}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid #e8edf5',
            overflowX: 'auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ minWidth: 850 }}>
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.3fr 1.1fr 1.6fr 1fr 1.1fr',
                padding: '12px 20px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                gap: 12,
              }}
            >
              <span>Affiliate</span>
              <span>Amount</span>
              <span>Method</span>
              <span>Reference</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {/* Table rows */}
            {filtered.map((p, i) => {
              const aff = p.affiliates
              const profile = aff?.profiles
              const name = profile?.full_name || 'Unknown'
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.3fr 1.1fr 1.6fr 1fr 1.1fr',
                    padding: '14px 20px',
                    borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Affiliate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar url={profile?.avatar_url} name={name} size={34} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13.5,
                          color: '#1a1f36',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: '#94a3b8',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {aff?.affiliate_code}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d' }}>
                    {fmt(p.amount)}
                  </div>

                  {/* Method */}
                  <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                    {p.payout_method || '—'}
                  </div>

                  {/* Reference */}
                  <div
                    style={{
                      fontSize: 12.5,
                      color: '#6366f1',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={p.transaction_ref || ''}
                  >
                    {p.transaction_ref || '—'}
                  </div>

                  {/* Status */}
                  <div>
                    <Badge status={p.status} map={PAYOUT_STATUS} />
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    {fmtDate(p.paid_at || p.created_at)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPayouts() {
  const [activeTab, setActiveTab] = useState('pending')
  const [commissions, setCommissions] = useState([])
  const [payouts, setPayouts] = useState([])
  const [loadingCommissions, setLoadingCommissions] = useState(true)
  const [loadingPayouts, setLoadingPayouts] = useState(true)
  const [modalGroup, setModalGroup] = useState(null)
  const [historyFilter, setHistoryFilter] = useState('all')
  const { toasts, add: addToast, remove: removeToast } = useToast()

  // ── Fetch pending commissions ──────────────────────────────────────────────
  const fetchCommissions = useCallback(async () => {
    setLoadingCommissions(true)
    try {
      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select(`
          *,
          affiliates!affiliate_commissions_affiliate_id_fkey(
            id, affiliate_code, commission_rate, total_paid,
            profiles!affiliates_user_id_fkey(full_name, email, avatar_url)
          )
        `)
        .in('status', ['approved', 'pending'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setCommissions(data || [])
    } catch (err) {
      console.error('[AdminPayouts] fetchCommissions error:', err)
      addToast('Failed to load pending commissions.', 'error')
    } finally {
      setLoadingCommissions(false)
    }
  }, [addToast])

  // ── Fetch payout history ──────────────────────────────────────────────────
  const fetchPayouts = useCallback(async () => {
    setLoadingPayouts(true)
    try {
      const { data, error } = await supabase
        .from('affiliate_payouts')
        .select(`
          *,
          affiliates!affiliate_payouts_affiliate_id_fkey(
            affiliate_code,
            profiles!affiliates_user_id_fkey(full_name, email, avatar_url)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayouts(data || [])
    } catch (err) {
      console.error('[AdminPayouts] fetchPayouts error:', err)
      addToast('Failed to load payout history.', 'error')
    } finally {
      setLoadingPayouts(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchCommissions()
    fetchPayouts()
  }, [fetchCommissions, fetchPayouts])

  // ── Group commissions by affiliate ─────────────────────────────────────────
  const affiliateGroups = (() => {
    const map = {}
    for (const c of commissions) {
      const aff = c.affiliates
      if (!aff) continue
      const key = aff.id
      if (!map[key]) {
        map[key] = { affiliate: aff, commissions: [], totalAmount: 0 }
      }
      map[key].commissions.push(c)
      map[key].totalAmount += c.commission_amount || 0
    }
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount)
  })()

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalPending = affiliateGroups.reduce((s, g) => s + g.totalAmount, 0)
  const affiliatesWithPending = affiliateGroups.length
  const paidPayouts = payouts.filter((p) => p.status === 'paid')
  const totalPaidToDate = paidPayouts.reduce((s, p) => s + (p.amount || 0), 0)

  // ── Payout success ─────────────────────────────────────────────────────────
  const handlePayoutSuccess = () => {
    setModalGroup(null)
    addToast('Payout created successfully! Commissions marked as paid.', 'success')
    fetchCommissions()
    fetchPayouts()
  }

  return (
    <div
      className="payouts-page-container"
      style={{
        padding: '28px 32px',
        maxWidth: 1100,
        margin: '0 auto',
        fontFamily: 'var(--font, Inter, sans-serif)',
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .payouts-stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .payouts-stats-grid {
            grid-template-columns: 1fr !important;
          }
          .payouts-page-container {
            padding: 16px 12px !important;
          }
        }
      `}</style>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#1a1f36',
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          Affiliate Payouts
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, margin: '6px 0 0', fontWeight: 400 }}>
          Manage commission payouts for your affiliate partners
        </p>
      </div>

      {/* Summary stat cards */}
      <div
        className="payouts-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
          marginBottom: 30,
        }}
      >
        <StatCard
          label="Total Pending Amount"
          value={fmt(totalPending)}
          sub={`${commissions.length} commission${commissions.length !== 1 ? 's' : ''} awaiting payout`}
          icon={
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(-10deg)' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          gradient="linear-gradient(135deg,#f59e0b,#d97706)"
        />
        <StatCard
          label="Affiliates with Pending"
          value={affiliatesWithPending}
          sub={
            affiliatesWithPending === 0
              ? 'All affiliates paid up'
              : `affiliate${affiliatesWithPending !== 1 ? 's' : ''} need payment`
          }
          icon={
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          gradient="linear-gradient(135deg,#6366f1,#4f46e5)"
        />
        <StatCard
          label="Total Paid to Date"
          value={fmt(totalPaidToDate)}
          sub={`${paidPayouts.length} completed payout${paidPayouts.length !== 1 ? 's' : ''}`}
          icon={
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
          gradient="linear-gradient(135deg,#10b981,#059669)"
        />
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: 24,
          gap: 0,
        }}
      >
        {[
          {
            key: 'pending',
            label: 'Pending Commissions',
            count: affiliateGroups.length,
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
          },
          {
            key: 'history',
            label: 'Payout History',
            count: payouts.length,
            icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            ),
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 22px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 14.5,
              color: activeTab === tab.key ? '#6366f1' : '#64748b',
              borderBottom:
                activeTab === tab.key
                  ? '3px solid #6366f1'
                  : '3px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span
              style={{
                background: activeTab === tab.key ? '#6366f1' : '#e2e8f0',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                borderRadius: 20,
                padding: '1px 8px',
                fontSize: 11.5,
                fontWeight: 700,
                minWidth: 22,
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'pending' ? (
        <PendingTab
          groups={affiliateGroups}
          loading={loadingCommissions}
          onCreatePayout={setModalGroup}
        />
      ) : (
        <HistoryTab
          payouts={payouts}
          loading={loadingPayouts}
          filter={historyFilter}
          onFilterChange={setHistoryFilter}
        />
      )}

      {/* Payout modal */}
      {modalGroup && (
        <PayoutModal
          affiliateGroup={modalGroup}
          onClose={() => setModalGroup(null)}
          onSuccess={handlePayoutSuccess}
        />
      )}

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
