import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CONFIG } from '../lib/config'
import { useCurrency } from '../context/CurrencyContext'

export function getShortDesc(product) {
  if (!product) return ''
  if (product.short_description) return product.short_description
  const desc = product.description || ''
  if (!desc) return ''
  if (desc.includes('<')) {
    const pMatch = desc.match(/<p[^>]*>(.*?)<\/p>/i)
    if (pMatch && pMatch[1]) {
      const stripped = pMatch[1].replace(/<[^>]*>/g, '').trim()
      if (stripped) return stripped
    }
    const plainText = desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    return plainText.length > 160 ? plainText.substring(0, 160) + '...' : plainText
  }
  const paragraphs = desc.split(/\n\s*\n/)
  if (paragraphs.length > 0 && paragraphs[0].trim()) {
    return paragraphs[0].trim()
  }
  return desc
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { formatPrice } = useCurrency()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistedIds, setWishlistedIds] = useState([])
  const [reviewsMap, setReviewsMap] = useState({})
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '')
  }, [searchParams])

  const isMobileOrTablet = windowWidth < 1024

  const formatCategoryName = (cat) => {
    if (!cat) return ''
    if (cat === 'all') return 'All Products'
    if (cat === 'shoes') return 'Shoes'
    if (cat === 'apparel') return "Apparel"
    if (cat === 'accessories') return 'Accessories'
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase()
  }

  const renderSidebarFilters = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Search */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0f0d0a', marginBottom: '10px' }}>Search</h4>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search catalog..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: '#ffffff', color: '#1e293b' }}
            />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0f0d0a', marginBottom: '12px' }}>Categories</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { label: 'All Products', value: 'all' },
              { label: 'Exquisite Shoes', value: 'shoes' },
              { label: 'Men\'s Apparel', value: 'apparel' },
              { label: 'Elegant Accessories', value: 'accessories' }
            ].map(cat => {
              const isActive = (categoryQueryParam || categoryFilter) === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => {
                    setCategoryFilter(cat.value)
                    if (categoryQueryParam) {
                      navigate('/products')
                    }
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    background: isActive ? 'rgba(18,60,36,0.04)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: isActive ? 'var(--brand-primary)' : '#475569',
                    fontSize: '13.5px',
                    fontWeight: isActive ? '700' : '500',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = '#f1f5f9'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <span>{cat.label}</span>
                  {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c5a880' }} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0f0d0a', marginBottom: '12px' }}>Price Range</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'All Prices', value: 'all' },
              { label: 'Under ₦25,000', value: 'under_25' },
              { label: '₦25,000 - ₦50,000', value: '25_50' },
              { label: '₦50,000 - ₦100,000', value: '50_100' },
              { label: 'Over ₦100,000', value: 'over_100' }
            ].map(range => {
              const isActive = priceFilter === range.value;
              return (
                <label key={range.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#475569', fontWeight: isActive ? '600' : '400' }}>
                  <input 
                    type="radio" 
                    name="priceFilter" 
                    checked={isActive}
                    onChange={() => setPriceFilter(range.value)}
                    style={{ cursor: 'pointer', accentColor: '#c5a880' }}
                  />
                  <span>{range.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Availability */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0f0d0a', marginBottom: '12px' }}>Availability</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#475569' }}>
            <input 
              type="checkbox" 
              checked={stockFilter === 'in_stock'}
              onChange={e => setStockFilter(e.target.checked ? 'in_stock' : 'all')}
              style={{ cursor: 'pointer', accentColor: '#c5a880', width: '16px', height: '16px' }}
            />
            <span>In Stock Only</span>
          </label>
        </div>

        {/* Clear All */}
        {(categoryFilter !== 'all' || priceFilter !== 'all' || stockFilter !== 'all' || searchQuery !== '' || categoryQueryParam) && (
          <button
            onClick={() => {
              setCategoryFilter('all')
              setPriceFilter('all')
              setStockFilter('all')
              setSearchQuery('')
              navigate('/products')
            }}
            style={{
              width: '100%',
              padding: '10px',
              background: 'none',
              border: '1px dashed #cbd5e1',
              borderRadius: '4px',
              color: '#ef4444',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Clear All Filters
          </button>
        )}
      </div>
    )
  }

  useEffect(() => {
    async function loadProductsAndReviews() {
      try {
        const [resProducts, resReviews] = await Promise.all([
          supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }),
          supabase.from('reviews').select('course_id, rating')
        ])

        if (resProducts.data) {
          setProducts(resProducts.data)
        }

        if (resReviews.data) {
          const map = {}
          resReviews.data.forEach(r => {
            if (!map[r.course_id]) {
              map[r.course_id] = { totalRating: 0, count: 0 }
            }
            map[r.course_id].totalRating += r.rating
            map[r.course_id].count += 1
          })
          const finalMap = {}
          Object.keys(map).forEach(cid => {
            finalMap[cid] = {
              rating: map[cid].totalRating / map[cid].count,
              count: map[cid].count
            }
          })
          setReviewsMap(finalMap)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProductsAndReviews()
  }, [])

  useEffect(() => {
    async function loadWishlist() {
      if (!user) return
      try {
        const { data } = await supabase
          .from('wishlist')
          .select('product_id')
          .eq('user_id', user.id)
        if (data) setWishlistedIds(data.map(w => w.product_id))
      } catch (err) {
        console.error(err)
      }
    }
    loadWishlist()
  }, [user])

  const toggleWishlist = async (e, productId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    const is = wishlistedIds.includes(productId)
    try {
      if (is) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId)
        setWishlistedIds(ids => ids.filter(id => id !== productId))
      } else {
        await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId })
        setWishlistedIds(ids => [...ids, productId])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const searchQueryParam = searchParams.get('search') || ''
  const categoryQueryParam = searchParams.get('category') || ''

  const filtered = products.filter(p => {
    // Basic types filtering (only physical if digital is toggled off)
    let typeMatches = true
    if (!CONFIG.ENABLE_DIGITAL_PRODUCTS) {
      typeMatches = p.type === 'physical'
    }

    // Category URL/Filter parameter
    let categoryMatches = true
    const activeCat = categoryQueryParam || categoryFilter
    if (activeCat && activeCat !== 'all') {
      const cat = activeCat.toLowerCase()
      const slug = (p.slug || '').toLowerCase()
      const title = (p.title || '').toLowerCase()
      const meta = (p.meta_title || '').toLowerCase()
      categoryMatches = slug.includes(cat) || title.includes(cat) || meta.includes(cat)
    }

    // Search query parameter
    let searchMatches = true
    const activeSearch = searchQuery.toLowerCase().trim()
    if (activeSearch) {
      searchMatches = (p.title || '').toLowerCase().includes(activeSearch) || 
                      (p.description || '').toLowerCase().includes(activeSearch)
    }

    // Price Range Filter
    let priceMatches = true
    let displayPrice = p.price
    const hasVariants = p.variations?.variants && p.variations.variants.length > 0
    if (hasVariants) {
      const prices = p.variations.variants.map(v => v.price).filter(Boolean)
      if (prices.length > 0) {
        displayPrice = Math.min(...prices)
      }
    }

    if (priceFilter === 'under_25') {
      priceMatches = displayPrice < 25000
    } else if (priceFilter === '25_50') {
      priceMatches = displayPrice >= 25000 && displayPrice <= 50000
    } else if (priceFilter === '50_100') {
      priceMatches = displayPrice >= 50000 && displayPrice <= 100000
    } else if (priceFilter === 'over_100') {
      priceMatches = displayPrice > 100000
    }

    // Stock Availability Filter
    let stockMatches = true
    if (stockFilter === 'in_stock') {
      stockMatches = p.stock_quantity === null || p.stock_quantity > 0
    }

    return typeMatches && categoryMatches && searchMatches && priceMatches && stockMatches
  })

  const sorted = [...filtered].sort((a, b) => {
    let priceA = a.price
    const hasVariantsA = a.variations?.variants && a.variations.variants.length > 0
    if (hasVariantsA) {
      const prices = a.variations.variants.map(v => v.price).filter(Boolean)
      if (prices.length > 0) priceA = Math.min(...prices)
    }

    let priceB = b.price
    const hasVariantsB = b.variations?.variants && b.variations.variants.length > 0
    if (hasVariantsB) {
      const prices = b.variations.variants.map(v => v.price).filter(Boolean)
      if (prices.length > 0) priceB = Math.min(...prices)
    }

    if (sortBy === 'price_asc') {
      return priceA - priceB
    } else if (sortBy === 'price_desc') {
      return priceB - priceA
    } else if (sortBy === 'alphabetical') {
      return (a.title || '').localeCompare(b.title || '')
    } else if (sortBy === 'newest') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    }
    return 0
  })

  const StarRating = ({ rating = 4.8 }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i < Math.floor(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </span>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>

      {/* ─── CATALOG LAYOUT ─── */}
      <section style={{ padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? '1fr' : '260px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Desktop Sidebar Filters */}
          {!isMobileOrTablet && (
            <aside style={{
              position: 'sticky',
              top: '80px',
              padding: '24px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#ffffff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}>
              {renderSidebarFilters()}
            </aside>
          )}

          {/* Catalog Content (Top Bar + Grid) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Top Products Bar (Counts + Mobile Toggle + Sort By) */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: '24px', 
              paddingBottom: '16px', 
              borderBottom: '1px solid #e2e8f0', 
              gap: '12px', 
              flexWrap: 'wrap' 
            }}>
              <div style={{ fontSize: '13.5px', color: '#64748b' }}>
                Showing <strong>{sorted.length}</strong> product{sorted.length !== 1 ? 's' : ''}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobileOrTablet && (
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    <span>Filters</span>
                  </button>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#334155',
                      outline: 'none',
                      cursor: 'pointer',
                      background: '#ffffff'
                    }}
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="alphabetical">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active filter pills */}
            {(categoryFilter !== 'all' || priceFilter !== 'all' || stockFilter !== 'all' || searchQuery !== '' || categoryQueryParam) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#64748b', fontWeight: '500' }}>Active Filters:</span>
                {categoryFilter !== 'all' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    Category: {formatCategoryName(categoryFilter)}
                    <button onClick={() => setCategoryFilter('all')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#94a3b8', padding: 0 }}>×</button>
                  </span>
                )}
                {categoryQueryParam && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    Category: {formatCategoryName(categoryQueryParam)}
                    <button onClick={() => navigate('/products')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#94a3b8', padding: 0 }}>×</button>
                  </span>
                )}
                {priceFilter !== 'all' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    Price: {priceFilter === 'under_25' ? 'Under ₦25k' : priceFilter === '25_50' ? '₦25k - ₦50k' : priceFilter === '50_100' ? '₦50k - ₦100k' : 'Over ₦100k'}
                    <button onClick={() => setPriceFilter('all')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#94a3b8', padding: 0 }}>×</button>
                  </span>
                )}
                {stockFilter !== 'all' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    In Stock Only
                    <button onClick={() => setStockFilter('all')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#94a3b8', padding: 0 }}>×</button>
                  </span>
                )}
                {searchQuery !== '' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#94a3b8', padding: 0 }}>×</button>
                  </span>
                )}
                <button onClick={() => { setCategoryFilter('all'); setPriceFilter('all'); setStockFilter('all'); setSearchQuery(''); navigate('/products'); }} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', padding: 0, marginLeft: '4px' }}>Clear All</button>
              </div>
            )}

            {/* Products Grid */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '20px' }}>
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: '18px', background: '#f1f5f9', width: '75%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: '12px', background: '#f1f5f9', width: '50%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', color: '#94a3b8' }}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                <h3 style={{ fontSize: '18px', color: '#0f0d0a', fontWeight: 800, margin: '0 0 6px' }}>No products found</h3>
                <p style={{ margin: 0, fontSize: '13.5px' }}>Try adjusting your filters or search query to find what you're looking for!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobileOrTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '20px' }} className="products-grid">
                {sorted.map(product => {
                  const isWishlisted = wishlistedIds.includes(product.id)
                  const ratingInfo = reviewsMap[product.id] || null
                  
                  let displayPrice = product.price
                  let displayOldPrice = product.old_price
                  const hasVariants = product.variations?.variants && product.variations.variants.length > 0
                  if (hasVariants) {
                    const prices = product.variations.variants.map(v => v.price).filter(Boolean)
                    if (prices.length > 0) {
                      displayPrice = Math.min(...prices)
                      const cheapestVariant = product.variations.variants.find(v => v.price === displayPrice)
                      displayOldPrice = cheapestVariant?.compare_price || null
                    }
                  }

                  const discount = displayOldPrice && displayOldPrice > displayPrice 
                    ? Math.round(((displayOldPrice - displayPrice) / displayOldPrice) * 100) 
                    : null

                  return (
                    <div key={product.id} style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                      transition: 'all 0.2s ease'
                    }} className="product-card-hover">
                      
                      {/* Discount badge */}
                      {discount && (
                        <span style={{
                          position: 'absolute', top: '10px', left: '10px',
                          background: '#16a34a', color: '#fff',
                          fontSize: '10px', fontWeight: 800,
                          padding: '2px 8px', borderRadius: '4px', zIndex: 5
                        }}>{discount}% OFF</span>
                      )}

                      {/* Wishlist Toggle */}
                      <button
                        onClick={(e) => toggleWishlist(e, product.id)}
                        style={{
                          position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: '#ffffff', border: '1px solid #e2e8f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', color: isWishlisted ? '#ef4444' : '#94a3b8',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </button>

                      {/* Card Image */}
                      <Link to={`/product/${product.slug || product.id}`} style={{ display: 'block', width: '100%', aspectRatio: '1 / 1', overflow: 'hidden', background: '#f8fafc' }}>
                        <img 
                          src={product.cover_image || '/logo.png'} 
                          alt={`${product.title.replace(/\s+slug$/i, '')} - Premium product from JGOLD SIGNATURES`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          onError={e => { e.currentTarget.src = '/logo.png'; e.currentTarget.style.padding = '20px' }}
                        />
                      </Link>

                      {/* Content */}
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                        <div>
                          <Link to={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none' }}>
                            <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 6px', lineHeight: '1.3' }}>
                              {product.title.replace(/\s+slug$/i, '')}
                            </h3>
                          </Link>
                          
                          {ratingInfo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                              <StarRating rating={ratingInfo.rating} />
                              <span style={{ fontSize: '11px', color: '#64748b' }}>({ratingInfo.count})</span>
                            </div>
                          )}

                          <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                            {product.short_description
                              ? product.short_description.substring(0, 100)
                              : getShortDesc(product).substring(0, 100)}
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f0d0a' }}>
                              {hasVariants ? 'From ' : ''}{formatPrice(displayPrice)}
                            </span>
                            {displayOldPrice && displayOldPrice > displayPrice && (
                              <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                {formatPrice(displayOldPrice)}
                              </span>
                            )}
                          </div>

                          <Link to={`/product/${product.slug || product.id}`} style={{
                            background: '#0f0d0a',
                            color: '#ffffff',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration: 'none',
                            textAlign: 'center',
                            display: 'block',
                            transition: 'background-color 0.15s ease'
                          }} className="card-btn-hover">
                            Buy Now <span>→</span>
                          </Link>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Mobile Filters Drawer Modal */}
      {showMobileFilters && isMobileOrTablet && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,23,42,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'flex-end',
        }} onClick={() => setShowMobileFilters(false)}>
          <div style={{
            width: '85%',
            maxWidth: '320px',
            height: '100%',
            background: '#ffffff',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f0d0a', margin: 0 }}>Filter Products</h3>
              <button 
                onClick={() => setShowMobileFilters(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', padding: 0 }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px' }}>
              {renderSidebarFilters()}
            </div>
            
            <button
              onClick={() => setShowMobileFilters(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0f0d0a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* ─── BOTTOM CTA SECTION ─── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '48px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }} className="bottom-banner-flex">
          <div>
            <h3 style={{ fontSize: '18px', color: '#0f0d0a', fontWeight: 800, margin: '0 0 6px' }}>Already a customer?</h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#64748b' }}>Track your orders and manage shipping options in your account area.</p>
          </div>
          <Link to="/dashboard" style={{
            background: 'transparent',
            color: 'var(--brand-primary)',
            border: '1.5px solid var(--brand-primary)',
            padding: '11px 22px',
            borderRadius: '4px',
            fontWeight: 700,
            fontSize: '13px',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(18,60,36,0.04)'}
             onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Go to My Account <span>→</span>
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .product-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(18,60,36,0.06), 0 4px 8px rgba(18,60,36,0.02) !important;
          border-color: var(--brand-primary) !important;
        }
        .product-card-hover:hover .card-btn-hover {
          background-color: var(--brand-hover) !important;
        }
        .filter-tabs-scroll::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section[style*="padding: 80px"] {
            padding: 48px 24px !important;
          }
          h1 {
            font-size: 30px !important;
          }
        }
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .bottom-banner-flex {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>

    </div>
  )
}
