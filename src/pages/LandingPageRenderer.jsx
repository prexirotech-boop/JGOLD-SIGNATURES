import React, { useState, useEffect, useRef } from 'react'
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

  // Custom Dropdown Open States
  const [sizeOpen, setSizeOpen] = useState(false)
  const [qtyOpen, setQtyOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)

  // Refs for closing dropdowns on click outside
  const sizeRef = useRef(null)
  const qtyRef = useRef(null)
  const paymentRef = useRef(null)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  useEffect(() => {
    function handleClickOutside(event) {
      if (sizeRef.current && !sizeRef.current.contains(event.target)) setSizeOpen(false)
      if (qtyRef.current && !qtyRef.current.contains(event.target)) setQtyOpen(false)
      if (paymentRef.current && !paymentRef.current.contains(event.target)) setPaymentOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
      email: 'customer@jgoldsignatures.com.ng', // Placeholder email
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
  const headlineText = pageData.headline || 'Handcrafted Luxury For The Modern Gentleman'
  const subheadlineText = pageData.subheadline || 'Experience unmatched comfort and style with our premium bespoke collection.'
  const highlightsList = Array.isArray(pageData.highlights) ? pageData.highlights : []

  // Options lists
  const sizes = ['39', '40', '41', '42', '43', '44', '45', '46']
  const quantities = [1, 2, 3, 4, 5, 6]
  const payments = [
    { value: 'cash_on_delivery', label: 'Cash on Delivery (Pay on arrival)' },
    { value: 'bank_transfer', label: 'Direct Bank Transfer' }
  ]

  // Styles
  const formFieldLabelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  const formInputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.15s ease-in-out',
    background: '#ffffff',
    color: '#1f2937'
  }

  const dropdownButtonStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #d1d5db',
    fontSize: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#ffffff',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none',
    textAlign: 'left',
    boxSizing: 'border-box'
  }

  const dropdownOverlayStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    background: '#ffffff',
    border: '1.5px solid #d1d5db',
    borderRadius: '10px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    marginTop: '6px',
    zIndex: 1000,
    maxHeight: '220px',
    overflowY: 'auto',
    boxSizing: 'border-box'
  }

  const dropdownOptionStyle = {
    padding: '10px 16px',
    fontSize: '14.5px',
    cursor: 'pointer',
    color: '#374151',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.1s ease'
  }

  return (
    <div style={{ background: '#faf8f5', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* BRAND BANNER LOGO */}
      <div style={{ background: '#0f0d0a', padding: '24px 20px', textAlign: 'center', borderBottom: '3px solid #dfb26c' }}>
        <img src="/logo.webp" alt="JGOLD SIGNATURES" style={{ height: 50, width: 'auto', display: 'block', margin: '0 auto', filter: 'brightness(0) invert(1)' }} />
      </div>

      <main style={{ maxWidth: 840, margin: '0 auto', padding: isMobile ? '24px 12px 80px' : '40px 16px 80px' }}>
        
        {/* HERO COPY SECTIONS */}
        <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 8px' }}>
          <h1 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: 900, color: '#0f0d0a', margin: '0 0 12px', lineHeight: 1.2 }}>
            {headlineText}
          </h1>
          <p style={{ color: '#4b5563', fontSize: isMobile ? '15px' : '17px', lineHeight: 1.6, maxWidth: 640, margin: '0 auto 24px' }}>
            {subheadlineText}
          </p>

          {/* Highlights Bullets */}
          {highlightsList.length > 0 && (
            <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '10px', textAlign: 'left', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', maxWidth: '560px', width: '100%', boxSizing: 'border-box' }}>
              {highlightsList.map((hl, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '14px', color: '#374151' }}>
                  <span style={{ color: '#dfb26c', fontWeight: 'bold' }}>✓</span>
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* IMAGE GRID - 2 COLUMNS ON MOBILE, 3 COLUMNS ON DESKTOP */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
          gap: isMobile ? '12px' : '24px', 
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
                  border: isSelected ? '2.5px solid #dfb26c' : '1px solid #e5e7eb',
                  borderRadius: 14,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 10px 20px rgba(223,178,108,0.12)' : '0 2px 4px rgba(15,23,42,0.01)',
                  transition: 'all 0.15s ease-in-out',
                  transform: isSelected ? 'translateY(-2px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Product Image */}
                <div style={{ width: '100%', aspectRatio: '1/1', background: '#f9fafb', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.id_number} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#9ca3af', fontSize: 12, fontStyle: 'italic' }}>JGOLD Design</div>
                  )}
                </div>

                <div style={{ padding: isMobile ? 10 : 16, textAlign: 'center', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    {/* Product ID */}
                    <div style={{ fontWeight: 700, fontSize: isMobile ? '13px' : '14.5px', color: '#0f0d0a', marginBottom: 4 }}>
                      Design: {prod.id_number}
                    </div>

                    {/* Colors circles indicators */}
                    {colorsList.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                        {colorsList.map((col, cIdx) => (
                          <span 
                            key={cIdx} 
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: col,
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}
                            title={col}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Price */}
                    <div style={{ color: '#0f0d0a', fontWeight: 800, fontSize: isMobile ? '16px' : '18px', marginBottom: 10 }}>
                      ₦{Number(prod.price || 0).toLocaleString()}
                    </div>

                    {/* Selection Radio */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <input 
                        type="radio" 
                        name="selected_landing_item"
                        checked={isSelected}
                        onChange={() => setSelectedProduct(prod)}
                        style={{ cursor: 'pointer', margin: 0 }}
                      />
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: isSelected ? '#dfb26c' : '#6b7280', letterSpacing: '0.5px' }}>
                        {isSelected ? 'SELECTED' : 'CHOOSE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ORDER FORM SECTION */}
        <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          
          <div style={{ background: '#0f0d0a', padding: '24px 20px', textAlign: 'center', borderBottom: '3px solid #dfb26c' }}>
            <h3 style={{ margin: 0, color: '#ffffff', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              📦 Place Your Order
            </h3>
            <p style={{ margin: '4px 0 0', color: '#c5a880', fontSize: 13 }}>Fill in details below. Delivery is fast and secure.</p>
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
            <form onSubmit={handleSubmit} style={{ padding: isMobile ? '24px 16px' : '32px 32px' }}>
              
              {/* SELECTED PRODUCT SUMMARY WITH IMAGE */}
              {selectedProduct && (
                <div style={{ 
                  background: '#faf8f5', 
                  border: '1.5px solid #dfb26c', 
                  borderRadius: 12, 
                  padding: '16px', 
                  marginBottom: 28, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px'
                }}>
                  {/* Selected Item Image */}
                  <div style={{ width: 68, height: 68, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt="selected" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>No Image</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Selected Footwear</span>
                    <div style={{ fontWeight: 800, color: '#0f0d0a', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Design {selectedProduct.id_number}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4b5563', marginTop: 2 }}>
                      Size: {size} · Qty: {quantity} pair{quantity > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Price</span>
                    <div style={{ fontWeight: 900, color: '#0f0d0a', fontSize: '18px' }}>
                      ₦{Number((parseInt(selectedProduct.price) || 0) * quantity).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Input fields */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={formFieldLabelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="First and last name"
                    style={formInputStyle}
                    required
                    onFocus={e => e.target.style.borderColor = '#dfb26c'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={formFieldLabelStyle}>WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Active delivery number"
                    style={formInputStyle}
                    required
                    onFocus={e => e.target.style.borderColor = '#dfb26c'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '20px', marginBottom: 20 }}>
                <div>
                  <label style={formFieldLabelStyle}>Detailed Shipping Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="House/Office No, Street, Landmark details"
                    style={formInputStyle}
                    required
                    onFocus={e => e.target.style.borderColor = '#dfb26c'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div>
                  <label style={formFieldLabelStyle}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="e.g. Lagos"
                    style={formInputStyle}
                    required
                    onFocus={e => e.target.style.borderColor = '#dfb26c'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                {/* Custom Dropdown: Shoe Size */}
                <div ref={sizeRef} style={{ position: 'relative' }}>
                  <label style={formFieldLabelStyle}>Shoe Size</label>
                  <button 
                    type="button" 
                    onClick={() => { setSizeOpen(!sizeOpen); setQtyOpen(false); setPaymentOpen(false); }}
                    style={{
                      ...dropdownButtonStyle,
                      borderColor: sizeOpen ? '#dfb26c' : '#d1d5db',
                      boxShadow: sizeOpen ? '0 0 0 3px rgba(223,178,108,0.15)' : 'none'
                    }}
                  >
                    <span>Size {size}</span>
                    <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: sizeOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  {sizeOpen && (
                    <div style={dropdownOverlayStyle}>
                      {sizes.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => { setSize(sz); setSizeOpen(false); }}
                          style={{
                            ...dropdownOptionStyle,
                            background: size === sz ? '#faf8f5' : 'transparent',
                            fontWeight: size === sz ? 700 : 500
                          }}
                        >
                          Size {sz}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Dropdown: Quantity */}
                <div ref={qtyRef} style={{ position: 'relative' }}>
                  <label style={formFieldLabelStyle}>Quantity</label>
                  <button 
                    type="button" 
                    onClick={() => { setQtyOpen(!qtyOpen); setSizeOpen(false); setPaymentOpen(false); }}
                    style={{
                      ...dropdownButtonStyle,
                      borderColor: qtyOpen ? '#dfb26c' : '#d1d5db',
                      boxShadow: qtyOpen ? '0 0 0 3px rgba(223,178,108,0.15)' : 'none'
                    }}
                  >
                    <span>{quantity} Pair{quantity > 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: qtyOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  {qtyOpen && (
                    <div style={dropdownOverlayStyle}>
                      {quantities.map(q => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => { setQuantity(q); setQtyOpen(false); }}
                          style={{
                            ...dropdownOptionStyle,
                            background: quantity === q ? '#faf8f5' : 'transparent',
                            fontWeight: quantity === q ? 700 : 500
                          }}
                        >
                          {q} Pair{q > 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: 32 }}>
                {/* Custom Dropdown: Payment Method */}
                <div ref={paymentRef} style={{ position: 'relative' }}>
                  <label style={formFieldLabelStyle}>Payment Method</label>
                  <button 
                    type="button" 
                    onClick={() => { setPaymentOpen(!paymentOpen); setSizeOpen(false); setQtyOpen(false); }}
                    style={{
                      ...dropdownButtonStyle,
                      borderColor: paymentOpen ? '#dfb26c' : '#d1d5db',
                      boxShadow: paymentOpen ? '0 0 0 3px rgba(223,178,108,0.15)' : 'none'
                    }}
                  >
                    <span>{payments.find(p => p.value === paymentMethod)?.label}</span>
                    <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: paymentOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
                  </button>
                  {paymentOpen && (
                    <div style={dropdownOverlayStyle}>
                      {payments.map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => { setPaymentMethod(p.value); setPaymentOpen(false); }}
                          style={{
                            ...dropdownOptionStyle,
                            background: paymentMethod === p.value ? '#faf8f5' : 'transparent',
                            fontWeight: paymentMethod === p.value ? 700 : 500
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={formFieldLabelStyle}>Order Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Specific delivery remarks"
                    style={formInputStyle}
                    onFocus={e => e.target.style.borderColor = '#dfb26c'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  background: '#0f0d0a',
                  color: '#ffffff',
                  padding: '16px 24px',
                  border: '1px solid #dfb26c',
                  borderRadius: 10,
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 15px rgba(15,23,42,0.15)',
                  opacity: submitting ? 0.7 : 1,
                  letterSpacing: '1px'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#1c1813'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#0f0d0a'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                {submitting ? 'PROCESSING YOUR ORDER...' : 'SUBMIT ORDER NOW'}
              </button>
            </form>
          )}

        </div>

      </main>
    </div>
  )
}
