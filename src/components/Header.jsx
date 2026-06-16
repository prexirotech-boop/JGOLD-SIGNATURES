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
    </>
  )
}
