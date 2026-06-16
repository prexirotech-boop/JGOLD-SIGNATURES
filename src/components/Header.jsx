import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import UserMenu from './UserMenu'
import { supabase } from '../lib/supabase'

export default function Header() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const location = useLocation()
  const { user } = useAuth()
  const dropdownRef = useRef(null)

  const [cartItems, setCartItems] = useState([])
  const [showCartDrawer, setShowCartDrawer] = useState(false)

  // Initialize and synchronize cart items from localStorage
  useEffect(() => {
    try {
      const items = JSON.parse(localStorage.getItem('amplified_cart')) || []
      setCartItems(items)
    } catch (e) {}

    const syncCart = () => {
      try {
        const items = JSON.parse(localStorage.getItem('amplified_cart')) || []
        setCartItems(items)
      } catch (e) {}
    }
    window.addEventListener('cart_updated', syncCart)
    window.addEventListener('storage', syncCart)
    return () => {
      window.removeEventListener('cart_updated', syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [])

  const handleRemoveFromCart = (itemId) => {
    const updated = cartItems.filter(item => item.id !== itemId)
    localStorage.setItem('amplified_cart', JSON.stringify(updated))
    setCartItems(updated)
    window.dispatchEvent(new Event('cart_updated'))
  }

  const handleProceedToCheckout = () => {
    setShowCartDrawer(false)
    if (cartItems.length > 0) {
      navigate(`/checkout?product=${cartItems[0].id}`)
    } else {
      navigate('/checkout')
    }
  }

  const cartSubtotal = cartItems.reduce((acc, item) => acc + (parseInt(item.price) || 0), 0)

  // Fetch all published products on mount for autocomplete search
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, title, slug, price, cover_image, type')
          .eq('is_published', true)
        if (!error && data) {
          setProducts(data)
        }
      } catch (err) {
        console.error('Error prefetching products:', err)
      }
    }
    fetchProducts()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts([])
      return
    }
    const query = searchQuery.toLowerCase()
    const matches = products.filter(p => 
      p.title.toLowerCase().includes(query) || 
      (p.type && p.type.toLowerCase().includes(query))
    )
    setFilteredProducts(matches)
  }, [searchQuery, products])

  // Pages where the global public header should NOT be displayed
  const hideHeaderOn = [
    '/ebook',
    '/course',
    '/checkout',
    '/setup-account',
    '/dashboard',
    '/account', // Fix: Hide on account to prevent double header
    '/login',
    '/forgot-password',
    '/reset-password'
  ]

  const shouldHide = hideHeaderOn.some(path => location.pathname === path) || location.pathname.startsWith('/course/')

  if (shouldHide) return null

  return (
    <>
      <header className="global-header">
        <Link to={user ? "/dashboard" : "/"} className="brand-link" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src="/logo.png" alt="Amplified Skills" style={{ height: 52, width: 'auto', maxWidth: 220, objectFit: 'contain', objectPosition: 'left center', display: 'block', flexShrink: 0 }} />
        </Link>

        <div className="header-search-wrapper" ref={dropdownRef} style={{ position: 'relative', flex: 1, maxWidth: '440px' }}>
          <div className="header-search-container" style={{ margin: 0, width: '100%', maxWidth: 'none' }}>
            <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search for courses or resources..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
                  setShowDropdown(false)
                }
              }}
              className="header-search-input"
            />
          </div>

          {/* Autocomplete Dropdown Panel */}
          {showDropdown && searchQuery.trim() && (
            <div className="search-dropdown-panel">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="search-dropdown-item"
                    onClick={() => {
                      if (product.type === 'ebook') {
                        navigate('/ebook')
                      } else {
                        navigate(`/product/${product.slug || product.id}`)
                      }
                      setSearchQuery('')
                      setShowDropdown(false)
                    }}
                  >
                    <img 
                      src={product.cover_image} 
                      alt={product.title} 
                      className="search-item-thumb" 
                      onError={e => { e.currentTarget.src = '/logo.png' }}
                    />
                    <div className="search-item-info">
                      <div className="search-item-title">{product.title}</div>
                      <div className="search-item-meta">
                        <span className="search-item-badge">{product.type === 'course' ? 'Course' : 'E-Book'}</span>
                        <span className="search-item-price">
                          {product.price ? `₦${Number(product.price).toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="search-dropdown-empty">
                  No courses or resources found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="desktop-nav">
          {[
            { label: 'Home', path: '/' },
            { label: 'Products', path: '/products' },
            { label: 'Blog', path: '/blog' },
            { label: 'FAQs', path: '/faq' },
            { label: 'About Us', path: '/about' },
            { label: 'Contact', path: '/contact' }
          ].map(item => (
            <Link
              key={item.label}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {/* Cart Toggle Button */}
          <button 
            onClick={() => setShowCartDrawer(true)} 
            className="cart-toggle-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#1e293b',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              marginRight: '8px',
              transition: 'color 0.2s'
            }}
            title="View Cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItems.length > 0 && (
              <span className="cart-badge" style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                minWidth: '17px',
                height: '17px',
                fontSize: '10px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
              }}>
                {cartItems.length}
              </span>
            )}
          </button>

          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link to="/login" className="btn-login">
              Sign In
            </Link>
          )}
          
          <button className="mobile-menu-btn" onClick={() => {
            const nav = document.getElementById('mobile-nav')
            nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex'
          }}>
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu — Solid White with Alternating Items */}
        <div id="mobile-nav" style={{ display: 'none', flexDirection: 'column', background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '8px 0 16px', position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 999, boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}>
        {/* Nav Links */}
        {[
          { label: 'Home', path: '/', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { label: 'Products', path: '/products', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
          { label: 'Blog', path: '/blog', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg> },
          { label: 'FAQs', path: '/faq', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg> },
          { label: 'About Us', path: '/about', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg> },
          { label: 'Contact', path: '/contact', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
        ].map((item, idx) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              style={{
                color: isActive ? '#2563eb' : '#374151',
                textDecoration: 'none',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13.5px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '11px',
                background: isActive ? 'rgba(37,99,235,0.06)' : '#ffffff',
                borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                borderBottom: '1px solid rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
                letterSpacing: '0.01em'
              }}
              onClick={() => document.getElementById('mobile-nav').style.display = 'none'}
            >
              <span style={{ color: isActive ? '#2563eb' : '#9ca3af', display: 'flex', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
      </header>

      {/* Sleek Slide-Out Cart Drawer */}
      <div className={`cart-drawer-overlay ${showCartDrawer ? 'active' : ''}`} onClick={() => setShowCartDrawer(false)}>
        <div className={`cart-drawer ${showCartDrawer ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="cart-drawer-header">
            <h3>Your Cart</h3>
            <button onClick={() => setShowCartDrawer(false)} className="cart-close-btn">✕</button>
          </div>
          
          <div className="cart-drawer-body">
            {cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" style={{ marginBottom: 16 }}>
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
                <button 
                  onClick={() => {
                    setShowCartDrawer(false);
                    navigate('/products');
                  }} 
                  className="cart-shop-btn"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item-card">
                    <img 
                      src={item.cover_image} 
                      alt={item.title} 
                      className="cart-item-thumb"
                      onError={e => { e.currentTarget.src = '/logo.png' }}
                    />
                    <div className="cart-item-details">
                      <h4 className="cart-item-title">{item.title.replace(/\s+slug$/i, '')}</h4>
                      <div className="cart-item-price-row">
                        <span className="cart-item-price">
                          {item.price ? `₦${Number(item.price).toLocaleString()}` : 'Free'}
                        </span>
                        {item.old_price && (
                          <span className="cart-item-old-price">
                            ₦{Number(item.old_price).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)} 
                      className="cart-item-remove-btn"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cartItems.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-total-row">
                <span>Subtotal</span>
                <span className="cart-total-price">₦{cartSubtotal.toLocaleString()}</span>
              </div>
              <button onClick={handleProceedToCheckout} className="cart-checkout-btn">
                Complete Payment
              </button>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .cart-drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(5, 11, 20, 0.6);
          backdrop-filter: blur(4px);
          z-index: 10000;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .cart-drawer-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
          z-index: 10001;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .cart-drawer.active {
          transform: translateX(0);
        }
        .cart-drawer-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .cart-drawer-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          font-family: var(--font-heading), sans-serif;
        }
        .cart-close-btn {
          background: none;
          border: none;
          font-size: 20px;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }
        .cart-close-btn:hover {
          color: #0f172a;
        }
        .cart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .cart-empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          text-align: center;
        }
        .cart-empty-state p {
          font-size: 15px;
          font-weight: 500;
          margin: 0 0 20px;
        }
        .cart-shop-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .cart-shop-btn:hover {
          background: #1d4ed8;
        }
        .cart-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cart-item-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          position: relative;
          transition: border-color 0.15s;
        }
        .cart-item-card:hover {
          border-color: #e2e8f0;
        }
        .cart-item-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          background: #f8fafc;
          flex-shrink: 0;
        }
        .cart-item-details {
          flex: 1;
          min-width: 0;
        }
        .cart-item-title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cart-item-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .cart-item-price {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }
        .cart-item-old-price {
          font-size: 12px;
          color: #94a3b8;
          text-decoration: line-through;
        }
        .cart-item-remove-btn {
          background: none;
          border: none;
          font-size: 14px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: color 0.15s;
          position: absolute;
          top: 8px;
          right: 8px;
        }
        .cart-item-remove-btn:hover {
          color: #ef4444;
        }
        .cart-drawer-footer {
          padding: 24px;
          border-top: 1px solid #f1f5f9;
          background: #f8fafc;
        }
        .cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .cart-total-row span:first-child {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }
        .cart-total-price {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .cart-checkout-btn {
          width: 100%;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #ffffff;
          border: none;
          padding: 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14.5px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .cart-checkout-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
        }
      `}} />
    </>
  )
}
