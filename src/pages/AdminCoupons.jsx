import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('draft_coupon_form')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return { code: '', type: 'percentage', value: '', usage_limit: '', expires_at: '', product_id: '' }
  })

  useEffect(() => {
    localStorage.setItem('draft_coupon_form', JSON.stringify(form))
  }, [form])

  const loadData = async () => {
    setLoading(true)
    const { data: cpn } = await supabase
      .from('coupons')
      .select('*, products(title)')
      .order('created_at', { ascending: false })
    if (cpn) setCoupons(cpn)

    const { data: prod } = await supabase
      .from('products')
      .select('id, title')
    if (prod) setProducts(prod)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.value) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: parseInt(form.value),
          usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
          expires_at: form.expires_at || null,
          product_id: form.product_id || null
        })

      if (error) throw error
      setShowAddModal(false)
      localStorage.removeItem('draft_coupon_form')
      setForm({ code: '', type: 'percentage', value: '', usage_limit: '', expires_at: '', product_id: '' })
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)
      if (error) throw error
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Promotions & Coupons</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Create discount coupons to boost marketing and track promotions usage.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.08)' }}
        >
          + Create Coupon
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#697386', fontSize: 13 }}>Loading promotions catalog...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8f9', borderBottom: '1px solid #e3e8ee' }}>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Coupon Code</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Discount Value</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Target Catalog</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Redemptions</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Expires</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>State</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr><td colSpan="7" style={{ padding: 24, textAlign: 'center', color: '#697386', fontSize: 13 }}>No active coupons found.</td></tr>
                ) : (
                  coupons.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f7f8f9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 600, color: '#2563eb', fontSize: 13.5, fontFamily: 'monospace' }}>{c.code}</td>
                      <td style={{ padding: '12px 20px', fontSize: 13.5, color: '#1a1f36' }}>
                        {c.type === 'percentage' ? `${c.value}% off` : `₦${c.value.toLocaleString()} off`}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#4f566b', fontSize: 13 }}>{c.products?.title || 'Entire Catalog'}</td>
                      <td style={{ padding: '12px 20px', color: '#4f566b', fontSize: 13 }}>
                        {c.usage_count} / {c.usage_limit || '∞'}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#697386', fontSize: 12 }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span 
                           onClick={() => handleToggleActive(c)}
                          style={{ 
                            padding: '2px 6px', 
                            background: c.is_active ? '#e3fcef' : '#ffebe6', 
                            color: c.is_active ? '#00875a' : '#ae2a19', 
                            borderRadius: 4, 
                            fontSize: 11, 
                            fontWeight: 500, 
                            cursor: 'pointer' 
                          }}
                        >
                          {c.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          style={{ background: 'none', border: 'none', color: '#ae2a19', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 450, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1f36' }}>Create Coupon</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Promo Code *</label>
                <input 
                  type="text" 
                  value={form.code} 
                  onChange={e => setForm({ ...form, code: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                  placeholder="e.g. AMPLIFIED50"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Discount Type</label>
                  <select 
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    style={{ 
                      width: '100%', 
                      padding: '8px 36px 8px 12px', 
                      borderRadius: 4, 
                      border: '1px solid #cbd5e1', 
                      fontSize: 13, 
                      background: '#fff',
                      appearance: 'none',
                      backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23697386' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>\")",
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '14px'
                    }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Value *</label>
                  <input 
                    type="number" 
                    value={form.value} 
                    onChange={e => setForm({ ...form, value: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                    required 
                    placeholder="e.g. 50"
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Target Specific Catalog Item</label>
                <select 
                  value={form.product_id}
                  onChange={e => setForm({ ...form, product_id: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px 36px 8px 12px', 
                    borderRadius: 4, 
                    border: '1px solid #cbd5e1', 
                    fontSize: 13, 
                    background: '#fff',
                    appearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23697386' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="">All Catalog Products</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Usage Limit</label>
                  <input 
                    type="number" 
                    value={form.usage_limit} 
                    onChange={e => setForm({ ...form, usage_limit: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                    placeholder="e.g. 100 (Blank for unlimited)"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Expiry Date</label>
                  <input 
                    type="date" 
                    value={form.expires_at} 
                    onChange={e => setForm({ ...form, expires_at: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                  {submitting ? 'Creating...' : 'Create Coupon'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
