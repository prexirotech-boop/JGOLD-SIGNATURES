import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LandingPageRenderer() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [pageData, setPageData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null) // holds selected product object
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('')
  const [size, setSize] = useState('42')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery')

  useEffect(() => {
    async function fetchLandingPage() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('landing_pages')
          .select('*')
          .eq('slug', slug)
          .single()

        if (error) throw error
        if (data) {
          setPageData(data)
          // Default select the first product in the list
          if (data.products && data.products.length > 0) {
            setSelectedProduct(data.products[0])
          }
        }
      } catch (err) {
        console.error('Landing page not found:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLandingPage()
  }, [slug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedProduct) {
      alert('Please select an item from the catalog before ordering.')
      return
    }

    setSubmitting(true)

    const orderRef = `JGOLD_LND_${Math.floor(100000 + Math.random() * 900000)}`
    const totalAmount = (parseInt(selectedProduct.price) || 0) * quantity

    const emailPayload = {
      name: name.trim(),
      email: 'customer@jgoldsignatures.com.ng', // Placeholder customer email to satisfy email system
      phone: phone.trim(),
      product_title: `Landing Page Order: ${selectedProduct.id_number} (Size: ${size}, Qty: ${quantity})`,
      amount: totalAmount,
      payment_method: paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer',
      ref: orderRef,
      shipping_street: address.trim(),
      shipping_city: state.trim(),
      shipping_state: state.trim()
    }

    try {
      // 1. Trigger email notification to ebonyjuliet15@yahoo.com via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'admin_new_order',
          to: 'ebonyjuliet15@yahoo.com',
          data: emailPayload
        }
      })

      if (emailError) throw emailError

      // 2. Also register order in public.orders if possible to keep admin dashboard in sync
      try {
        await supabase.from('orders').insert({
          reference: orderRef,
          customer_name: name.trim(),
          customer_email: 'customer@jgoldsignatures.com.ng',
          customer_phone: phone.trim(),
          amount: totalAmount,
          total_paid: totalAmount,
          currency: 'NGN',
          status: 'pending',
          payment_method: paymentMethod,
          shipping_street: address.trim(),
          shipping_city: state.trim(),
          shipping_state: state.trim(),
          shipping_zip: `Size: ${size}` // Save size in zip code slot as a fallback
        })
      } catch (dbErr) {
        console.warn('Silent fallback: Could not insert landing order in orders table.', dbErr)
      }

      setSuccess(true)

      // 3. Format WhatsApp checkout text & redirect
      const waText = `Hi JGOLD SIGNATURES,\n\nI just placed an order on your Landing Page (*${pageData.title}*):\n\n*Order Details:*\n- *Product ID:* ${selectedProduct.id_number}\n- *Size:* ${size}\n- *Quantity:* ${quantity}\n- *Price:* ₦${Number(selectedProduct.price).toLocaleString()} each\n- *Total:* ₦${totalAmount.toLocaleString()}\n- *Payment:* ${paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Bank Transfer'}\n\n*Customer Info:*\n- *Name:* ${name}\n- *Phone:* ${phone}\n- *Delivery Address:* ${address}, ${state} State\n${notes ? `- *Notes:* ${notes}\n` : ''}\n- *Ref:* #${orderRef}`
      
      const encodedWaText = encodeURIComponent(waText)
      setTimeout(() => {
        window.location.href = `https://wa.me/2348039714352?text=${encodedWaText}`
      }, 1500)

    } catch (err) {
      console.error(err)
      alert('Failed to place order: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#faf8f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #c5a880', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: 14, fontFamily: 'sans-serif' }}>Loading luxury catalog...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!pageData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#faf8f5', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h2 style={{ fontSize: 28, color: '#0f0d0a', fontWeight: 700, marginBottom: 8 }}>Page Not Found</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 20 }}>This landing page catalog does not exist or has been removed.</p>
          <button onClick={() => navigate('/products')} style={{ background: '#0f0d0a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Browse Shop</button>
        </div>
      </div>
    )
  }

  const productsList = pageData.products || []

  return (
    <div style={{ background: '#faf8f5', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* LUXURY STORE HEADER */}
      <header style={{ background: '#0f0d0a', padding: '16px 20px', textAlign: 'center', borderBottom: '2px solid #dfb26c', sticky: 'top', zIndex: 100 }}>
        <img src="/logo.webp" alt="JGOLD SIGNATURES" style={{ height: 48, width: 'auto', display: 'block', margin: '0 auto', filter: 'brightness(0) invert(1)' }} />
        <p style={{ color: '#c5a880', margin: '4px 0 0', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Luxury Footwear & Clothing Accessories</p>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px 80px' }}>
        
        {/* PAGE TITLE */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f0d0a', margin: '0 0 8px' }}>{pageData.title}</h1>
          <div style={{ width: 60, height: 3, background: '#dfb26c', margin: '0 auto 12px' }} />
          <p style={{ color: '#475569', fontSize: 15 }}>Select your preferred design from our catalog below and place your order.</p>
        </div>

        {/* IMAGE GRID - 3 COLUMNS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)', 
          gap: '24px', 
          marginBottom: 48 
        }}>
          {productsList.map((prod, idx) => {
            const isSelected = selectedProduct?.id_number === prod.id_number
            const colorsList = prod.colors ? prod.colors.split(',').map(c => c.trim()) : []
            
            return (
              <div 
                key={idx}
                onClick={() => setSelectedProduct(prod)}
                style={{
                  background: '#ffffff',
                  border: isSelected ? '2px solid #dfb26c' : '1px solid #e2e8f0',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 10px 20px rgba(223,178,108,0.15)' : '0 4px 6px rgba(15,23,42,0.02)',
                  transition: 'all 0.2s ease-in-out',
                  transform: isSelected ? 'translateY(-4px)' : 'none'
                }}
              >
                {/* Product Image */}
                <div style={{ width: '100%', aspectRatio: '1/1', background: '#f8fafc', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.id_number} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>JGOLD Design</div>
                  )}
                </div>

                <div style={{ padding: 16, textAlign: 'center' }}>
                  {/* Product ID */}
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f0d0a', marginBottom: 4 }}>
                    Design: {prod.id_number}
                  </div>

                  {/* Colors circles indicators */}
                  {colorsList.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                      {colorsList.map((col, cIdx) => (
                        <span 
                          key={cIdx} 
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: col,
                            border: '1px solid rgba(0,0,0,0.15)'
                          }}
                          title={col}
                        />
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div style={{ color: '#0f0d0a', fontWeight: 800, fontSize: 18, marginBottom: 12 }}>
                    ₦{Number(prod.price || 0).toLocaleString()}
                  </div>

                  {/* Selector Bubble */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <input 
                      type="radio" 
                      name="selected_landing_item"
                      checked={isSelected}
                      onChange={() => setSelectedProduct(prod)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#dfb26c' : '#64748b' }}>
                      {isSelected ? 'SELECTED' : 'SELECT DESIGN'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ORDER FORM SECTION */}
        <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          
          <div style={{ background: '#0f0d0a', padding: '24px 20px', textAlign: 'center', borderBottom: '3px solid #dfb26c' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              📝 Order Form
            </h3>
            <p style={{ margin: '4px 0 0', color: '#c5a880', fontSize: 13 }}>Please fill the form below to submit your order immediately.</p>
          </div>

          {success ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: 32 }}>✅</span>
              </div>
              <h4 style={{ fontSize: 22, fontWeight: 800, color: '#166534', margin: '0 0 8px' }}>Order Submitted!</h4>
              <p style={{ color: '#475569', fontSize: 15, margin: '0 0 20px', lineHeight: 1.6 }}>
                Your order for <strong>{selectedProduct?.id_number}</strong> has been received.<br />
                We are redirecting you to WhatsApp now to finalize dispatch details...
              </p>
              <a 
                href={`https://wa.me/2348039714352`}
                style={{ display: 'inline-block', background: '#25d366', color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 600 }}
              >
                Proceed to WhatsApp Chat
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ padding: '32px 24px' }}>
              {selectedProduct && (
                <div style={{ background: '#faf8f5', border: '1px solid #dfb26c', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Selected Item</span>
                    <div style={{ fontWeight: 800, color: '#0f0d0a', fontSize: 16 }}>{selectedProduct.id_number}</div>
                  </div>
                  <div style={{ textAlign: window.innerWidth < 768 ? 'left' : 'right' }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Price per Pair</span>
                    <div style={{ fontWeight: 800, color: '#0f0d0a', fontSize: 18 }}>₦{Number(selectedProduct.price).toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your first and last name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Phone Number (WhatsApp Active)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 08039714352"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Shipping Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Street name, Building description"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="e.g. Lagos"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Shoe Size</label>
                  <select
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {['39','40','41','42','43','44','45','46'].map(sz => (
                      <option key={sz} value={sz}>Size {sz}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Quantity</label>
                  <select
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  >
                    {[1,2,3,4,5,6].map(q => (
                      <option key={q} value={q}>{q} Pair{q > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="cash_on_delivery">Cash on Delivery (Pay on arrival)</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Notes / Remarks (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Any specific delivery details..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: 'var(--brand-primary, #0f0d0a)',
                  color: '#ffffff',
                  padding: '16px 24px',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Submitting Order Details...' : 'SUBMIT ORDER NOW'}
              </button>
            </form>
          )}

        </div>

      </main>
    </div>
  )
}
