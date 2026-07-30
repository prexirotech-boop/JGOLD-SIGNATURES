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
      const slug = (p.slug || '').toLowerCase()
      const title = (p.title || '').toLowerCase()
      categoryMatches = slug.includes(activeCat) || title.includes(activeCat)
    }

    // Search query parameter
    let searchMatches = true
    if (searchQueryParam) {
      const q = searchQueryParam.toLowerCase()
      searchMatches = (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    }

    return typeMatches && categoryMatches && searchMatches
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
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* ─── HERO HEADER (Redesigned matching Gallery Page style) ─── */}
      <section style={{ background: 'linear-gradient(135deg, #0f0d0a 0%, #1c1813 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#c5a880', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Premium Store Catalog
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Exquisite Men's Shoes & Accessories
          </h1>
          <p style={{ fontSize: '16px', color: '#f4eee3', lineHeight: '1.6', margin: 0 }}>
            High-quality luxury footwear and accessories delivered to your door. Secure payments and instant support.
          </p>
        </div>
      </section>

      {/* ─── FILTER BAR ─── */}
      <section style={{ borderBottom: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', top: 0, zIndex: 90 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px', gap: '12px' }}>
          {/* Scrollable filter tabs on mobile */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', flexShrink: 1, minWidth: 0 }} className="filter-tabs-scroll">
            {[
              { label: 'All Products', value: 'all' },
              { label: 'Exquisite Shoes', value: 'shoes' },
              { label: 'Men\'s Apparel', value: 'apparel' },
              { label: 'Elegant Accessories', value: 'accessories' }
            ].map(cat => (
              <button
                key={cat.value}
                onClick={() => {
                  setCategoryFilter(cat.value)
                  navigate('/products')
                }}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  background: (categoryQueryParam || categoryFilter) === cat.value ? 'rgba(18,60,36,0.06)' : 'transparent',
                  color: (categoryQueryParam || categoryFilter) === cat.value ? 'var(--brand-primary)' : '#64748b',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  if ((categoryQueryParam || categoryFilter) !== cat.value) e.currentTarget.style.background = '#f1f5f9'
                }}
                onMouseLeave={e => {
                  if ((categoryQueryParam || categoryFilter) !== cat.value) e.currentTarget.style.background = 'transparent'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 600, flexShrink: 0 }}>
            {loading ? 'Counting...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </section>

      {/* ─── PRODUCTS CATALOG GRID ─── */}
      <section style={{ padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '18px', background: '#f1f5f9', width: '70%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: '12px', background: '#f1f5f9', width: '50%', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: '#64748b' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <h3 style={{ fontSize: '18px', color: '#0f0d0a', fontWeight: 800, margin: '0 0 6px' }}>No products found</h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>Check back soon for new premium collections!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="products-grid">
            {filtered.map(product => {
              const isWishlisted = wishlistedIds.includes(product.id)
              const ratingInfo = reviewsMap[product.id] || null
              
              // Handle starting price display for variable products
              let displayPrice = product.price
              let displayOldPrice = product.old_price
              const hasVariants = product.variations?.variants && product.variations.variants.length > 0
              if (hasVariants) {
                const prices = product.variations.variants.map(v => v.price).filter(Boolean)
                if (prices.length > 0) {
                  displayPrice = Math.min(...prices)
                  // Find corresponding old price for the cheapest variant
                  const cheapestVariant = product.variations.variants.find(v => v.price === displayPrice)
                  displayOldPrice = cheapestVariant?.compare_price || null
                }
              }

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
                  
                  {/* Wishlist Toggle Action */}
                  <button
                    onClick={(e) => toggleWishlist(e, product.id)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 10,
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: isWishlisted ? '#ef4444' : '#94a3b8',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  </button>

                  {/* Card Image */}
                  <Link to={`/product/${product.slug || product.id}`} style={{ display: 'block', height: '140px', overflow: 'hidden', background: '#f8fafc' }}>
                    <img 
                      src={product.cover_image || '/logo.png'} 
                      alt={`${product.title.replace(/\s+slug$/i, '')} - Premium product from JGOLD SIGNATURES`} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                      onError={e => { e.currentTarget.src = '/logo.png'; e.currentTarget.style.padding = '20px' }}
                    />
                  </Link>

                  {/* Card Content details */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <Link to={`/product/${product.slug || product.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f0d0a', margin: '0 0 6px', lineHeight: '1.3' }}>
                          {product.title.replace(/\s+slug$/i, '')}
                        </h3>
                      </Link>
                      
                      {/* Review rating — only if real reviews exist */}
                      {ratingInfo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                          <StarRating rating={ratingInfo.rating} />
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>({ratingInfo.count})</span>
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
                        {displayOldPrice && (
                          <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            {formatPrice(displayOldPrice)}
                          </span>
                        )}
                      </div>

                      <Link to={`/product/${product.slug || product.id}`} style={{
                        background: 'var(--brand-primary)',
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
      </section>

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
