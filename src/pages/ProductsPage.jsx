import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const StarRating = ({ rating = 4.8 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    {[...Array(5)].map((_, i) => (
      <svg key={i} width="13" height="13" viewBox="0 0 24 24"
        fill={i < Math.floor(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
    <span style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginLeft: 2 }}>{rating.toFixed(1)}</span>
  </span>
)

const FILTERS = ['All', 'Courses', 'E-Books']

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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [wishlistedIds, setWishlistedIds] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [reviewsMap, setReviewsMap] = useState({})

  useEffect(() => {
    async function loadProducts() {
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

      setLoading(false)
    }
    loadProducts()
  }, [])

  useEffect(() => {
    async function loadWishlist() {
      if (!user) return
      const { data } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)
      if (data) setWishlistedIds(data.map(w => w.product_id))
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
    if (is) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId)
      setWishlistedIds(ids => ids.filter(id => id !== productId))
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId })
      setWishlistedIds(ids => [...ids, productId])
    }
  }

  const searchQueryParam = searchParams.get('search') || ''

  const filtered = products.filter(p => {
    let typeMatches = true
    if (activeFilter === 'Courses') typeMatches = p.type === 'course'
    else if (activeFilter === 'E-Books') typeMatches = p.type !== 'course'

    let searchMatches = true
    if (searchQueryParam) {
      const q = searchQueryParam.toLowerCase()
      searchMatches = (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    }

    return typeMatches && searchMatches
  })

  const isFree = (p) => p.is_free || p.price === 0

  return (
    <div className="lib-root">

      {/* Header */}
      <div className="lib-hero">
        <div className="lib-hero-content">
          <p className="lib-overline">Training Programs & Resources</p>
          <h1 className="lib-title">Build Real Skills.<br />Earn Real Income.</h1>
          <p className="lib-subtitle">
            Premium Nigerian-focused programs engineered to get you earning. 
            Everything you need — all in one place.
          </p>
          <div className="lib-stats">
            <div className="lib-stat"><span className="lib-stat-num">2,400+</span><span>Students Enrolled</span></div>
            <div className="lib-stat-divider" />
            <div className="lib-stat"><span className="lib-stat-num">4.9★</span><span>Average Rating</span></div>
            <div className="lib-stat-divider" />
            <div className="lib-stat"><span className="lib-stat-num">₦50K+</span><span>Avg Monthly Earnings</span></div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="lib-filterbar">
        <div className="lib-filterbar-inner">
          <div className="lib-filters">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`lib-filter-btn ${activeFilter === f ? 'active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="lib-count">
            {loading ? '' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="lib-grid-wrapper">
        {loading ? (
          <div className="lib-loading">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="lib-skeleton">
                <div className="skel-img" />
                <div className="skel-body">
                  <div className="skel-line" style={{ width: '80%', height: 18 }} />
                  <div className="skel-line" style={{ width: '60%', height: 14, marginTop: 10 }} />
                  <div className="skel-line" style={{ width: '40%', height: 22, marginTop: 16 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="lib-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" style={{ marginBottom: 16 }}>
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
            <h3>No products found</h3>
            <p>Check back soon for new programs!</p>
          </div>
        ) : (
          <div className="lib-grid">
            {filtered.map(product => {
              const isWishlisted = wishlistedIds.includes(product.id)
              const free = isFree(product)
              const isCourse = product.type === 'course'
              const features = Array.isArray(product.features) ? product.features : []
              const discountPct = product.old_price && product.price
                ? Math.round((1 - product.price / product.old_price) * 100)
                : null

              return (
                <Link
                  to={`/product/${product.slug || product.id}`}
                  key={product.id}
                  className="lib-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {/* Card Image */}
                  <div className="lib-card-img">
                    {product.cover_image ? (
                      <img src={product.cover_image} alt={product.title.replace(/\s+slug$/i, '')} />
                    ) : (
                      <div className="lib-img-placeholder">
                        {isCourse ? (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.7 }}>
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                          </svg>
                        ) : (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.7 }}>
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                        )}
                      </div>
                    )}
                    {/* Badges */}
                    <div className="lib-card-badges">
                      {free && <span className="lib-badge lib-badge-free">FREE</span>}
                      {!free && discountPct && <span className="lib-badge lib-badge-discount">{discountPct}% OFF</span>}
                      {product.is_featured && !free && (
                        <span className="lib-badge lib-badge-featured">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" style={{ marginRight: 4, display: 'inline-block', verticalAlign: 'middle' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Featured
                        </span>
                      )}
                    </div>
                    {/* Wishlist */}
                    <button
                      className={`lib-wish-btn ${isWishlisted ? 'active' : ''}`}
                      onClick={(e) => toggleWishlist(e, product.id)}
                      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <svg viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                    {/* Type Tag */}
                    <div className={`lib-type-tag ${isCourse ? 'course' : 'ebook'}`}>
                      {isCourse ? 'Course' : 'E-Book'}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="lib-card-body">
                    <h2 className="lib-card-title">{product.title.replace(/\s+slug$/i, '')}</h2>
                    <p className="lib-card-desc">{product.short_description || getShortDesc(product)}</p>

                    {(() => {
                      const ratingInfo = reviewsMap[product.id] || { rating: 0, count: 0 }
                      return (
                        <div className="lib-card-rating">
                          <StarRating rating={ratingInfo.rating} />
                          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>({ratingInfo.count})</span>
                        </div>
                      )
                    })()}

                    {features.length > 0 && (
                      <ul className="lib-card-features">
                        {features.slice(0, 3).map((f, i) => (
                          <li key={i}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="lib-card-footer">
                    <div className="lib-card-price">
                      {free ? (
                        <span className="lib-price-free">FREE</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                          <span className="lib-price-current">₦{product.price?.toLocaleString()}</span>
                          {product.old_price && (
                            <span className="lib-price-old">₦{product.old_price?.toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`lib-cta-label ${isCourse ? 'course' : 'ebook'}`}>
                      {free ? 'Enroll Free →' : isCourse ? 'Enroll Now →' : 'Get Now →'}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Banner */}
      <div className="lib-bottom-banner">
        <div className="lib-banner-inner">
          <div>
            <h3>Already a student?</h3>
            <p>Access your courses and materials from your learning dashboard.</p>
          </div>
          <Link to="/dashboard" className="lib-banner-btn">Go to My Dashboard →</Link>
        </div>
      </div>

      <style>{`
        .lib-root {
          font-family: var(--font);
          background: #f8fafc;
          min-height: 100vh;
        }

        /* ── HERO ── */
        .lib-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1e3a5f 100%);
          padding: 72px 24px 80px;
        }
        .lib-hero-content {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }
        .lib-overline {
          display: inline-block;
          background: rgba(255,255,255,.1);
          color: rgba(255,255,255,.7);
          padding: 6px 18px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,.15);
        }
        .lib-title {
          font-size: 52px;
          font-weight: 900;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 20px;
        }
        .lib-subtitle {
          font-size: 18px;
          color: rgba(255,255,255,.65);
          max-width: 560px;
          margin: 0 auto 36px;
          line-height: 1.7;
        }
        .lib-stats {
          display: inline-flex;
          align-items: center;
          gap: 24px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 60px;
          padding: 14px 32px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .lib-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .lib-stat-num {
          font-size: 18px;
          font-weight: 900;
          color: #fff;
        }
        .lib-stat span:last-child {
          font-size: 11px;
          color: rgba(255,255,255,.5);
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .lib-stat-divider {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,.15);
        }

        /* ── FILTER BAR ── */
        .lib-filterbar {
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 4px rgba(0,0,0,.05);
        }
        .lib-filterbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
        }
        .lib-filters {
          display: flex;
          gap: 4px;
        }
        .lib-filter-btn {
          padding: 7px 18px;
          border: 1.5px solid transparent;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          color: #64748b;
          transition: all 0.2s;
        }
        .lib-filter-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .lib-filter-btn.active {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #2563eb;
        }
        .lib-count {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* ── GRID ── */
        .lib-grid-wrapper {
          max-width: 1200px;
          margin: 40px auto;
          padding: 0 24px;
        }
        .lib-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        /* ── CARD ── */
        .lib-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          display: flex;
          flex-direction: column;
          cursor: pointer;
        }
        .lib-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(0,0,0,.12);
        }
        .lib-card-img {
          position: relative;
          height: 192px;
          background: linear-gradient(135deg, #1e3a5f, #2563eb);
          overflow: hidden;
          flex-shrink: 0;
        }
        .lib-card-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .lib-card:hover .lib-card-img img {
          transform: scale(1.04);
        }
        .lib-img-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          font-size: 56px;
        }
        .lib-card-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .lib-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }
        .lib-badge-free {
          background: #16a34a;
          color: #fff;
        }
        .lib-badge-discount {
          background: #dc2626;
          color: #fff;
        }
        .lib-badge-featured {
          background: rgba(245,158,11,.9);
          color: #fff;
          backdrop-filter: blur(4px);
        }
        .lib-wish-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,.9);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          transition: all 0.2s;
          padding: 0;
        }
        .lib-wish-btn:hover {
          background: #fff;
          color: #ef4444;
          transform: scale(1.1);
        }
        .lib-wish-btn.active {
          color: #ef4444;
          background: #fef2f2;
          border-color: #fecaca;
        }
        .lib-wish-btn svg { width: 17px; height: 17px; }
        .lib-type-tag {
          position: absolute;
          bottom: 10px;
          left: 10px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          backdrop-filter: blur(8px);
        }
        .lib-type-tag.course {
          background: rgba(37,99,235,.85);
          color: #fff;
        }
        .lib-type-tag.ebook {
          background: rgba(22,163,74,.85);
          color: #fff;
        }

        /* ── CARD BODY ── */
        .lib-card-body {
          padding: 20px 20px 0;
          flex: 1;
        }
        .lib-card-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.35;
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .lib-card-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.55;
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .lib-card-rating {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .lib-card-features {
          list-style: none;
          padding: 0;
          margin: 0 0 4px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .lib-card-features li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 12px;
          color: #475569;
          line-height: 1.4;
        }
        .lib-card-features svg { flex-shrink: 0; margin-top: 1px; }

        /* ── CARD FOOTER ── */
        .lib-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #f1f5f9;
          margin-top: 16px;
        }
        .lib-price-free {
          font-size: 20px;
          font-weight: 900;
          color: #16a34a;
          letter-spacing: -0.5px;
        }
        .lib-price-current {
          font-size: 20px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .lib-price-old {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 500;
        }
        .lib-cta-label {
          font-size: 13px;
          font-weight: 700;
          padding: 7px 14px;
          border-radius: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .lib-cta-label.course {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        .lib-cta-label.ebook {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .lib-card:hover .lib-cta-label.course {
          background: #2563eb;
          color: #fff;
          border-color: #2563eb;
        }
        .lib-card:hover .lib-cta-label.ebook {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }

        /* ── SKELETON ── */
        .lib-loading {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .lib-skeleton {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
        }
        .skel-img {
          height: 192px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 400% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skel-body { padding: 20px; }
        .skel-line {
          border-radius: 6px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 400% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        /* ── EMPTY ── */
        .lib-empty {
          text-align: center;
          padding: 80px 0;
          color: #64748b;
        }
        .lib-empty h3 { font-size: 22px; color: #0f172a; margin-bottom: 8px; }
        .lib-empty p { font-size: 15px; }

        /* ── BOTTOM BANNER ── */
        .lib-bottom-banner {
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          padding: 48px 24px;
          margin-top: 32px;
        }
        .lib-banner-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .lib-banner-inner h3 {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 6px;
        }
        .lib-banner-inner p {
          font-size: 15px;
          color: rgba(255,255,255,.65);
          margin: 0;
        }
        .lib-banner-btn {
          padding: 13px 28px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(37,99,235,.4);
          transition: all 0.2s;
        }
        .lib-banner-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37,99,235,.5);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .lib-title { font-size: 32px; }
          .lib-subtitle { font-size: 15px; }
          .lib-stats { padding: 12px 20px; gap: 16px; }
          .lib-stat-divider { display: none; }
          .lib-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
        }
        @media (max-width: 520px) {
          .lib-grid { grid-template-columns: 1fr; }
          .lib-title { font-size: 26px; }
          .lib-hero { padding: 48px 20px 56px; }
        }
      `}</style>
    </div>
  )
}
