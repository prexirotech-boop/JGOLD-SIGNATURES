import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const StarRating = ({ rating = 0, count = 0 }) => {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < full ? 'var(--gold)' : (i === full && half ? 'url(#half)' : 'none')} stroke="var(--gold)" strokeWidth="1.5">
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="var(--gold)" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 800 }}>{rating.toFixed(1)}</span>
      {count >= 0 && <span style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' }}>({count.toLocaleString()} reviews)</span>}
    </span>
  )
}

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

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [product, setProduct] = useState(null)
  const [courseData, setCourseData] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [openModule, setOpenModule] = useState(0)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [wishlistAdded, setWishlistAdded] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [reviewsAvg, setReviewsAvg] = useState(0)
  const [reviewsCount, setReviewsCount] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    async function load() {
      if (!productId) return

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)
      let query = supabase.from('products').select('*')
      if (isUUID) {
        query = query.eq('id', productId)
      } else {
        query = query.eq('slug', productId)
      }
      const { data: prod, error } = await query.maybeSingle()

      if (error || !prod) {
        navigate('/products')
        return
      }

      setProduct(prod)

      // Concurrently fetch all extra data points
      const promises = [
        // 1. Fetch reviews
        supabase.from('reviews').select('rating').eq('course_id', prod.id),
        // 2. Fetch course data if applicable
        prod.type === 'course' ? supabase.from('courses').select('*').eq('id', prod.id).maybeSingle() : Promise.resolve({ data: null }),
        // 3. Fetch modules & lessons if applicable
        prod.type === 'course' ? supabase.from('modules').select('*, lessons(*)').eq('course_id', prod.id).order('order_index', { ascending: true }) : Promise.resolve({ data: [] }),
        // 4. Check enrollment if logged in
        user ? supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', prod.id).maybeSingle() : Promise.resolve({ data: null }),
        // 5. Check wishlist if logged in
        user ? supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', prod.id).maybeSingle() : Promise.resolve({ data: null })
      ]

      const [revsRes, courseRes, modsRes, enrRes, wlRes] = await Promise.all(promises)

      // Set reviews state
      const revs = revsRes.data
      if (revs && revs.length > 0) {
        const sum = revs.reduce((acc, r) => acc + r.rating, 0)
        setReviewsAvg(sum / revs.length)
        setReviewsCount(revs.length)
      } else {
        setReviewsAvg(0)
        setReviewsCount(0)
      }

      // Set course metadata
      if (courseRes.data) {
        setCourseData(courseRes.data)
      }

      // Set modules & lessons
      if (modsRes.data) {
        setModules(modsRes.data.map(m => ({
          ...m,
          lessons: (m.lessons || []).sort((a, b) => a.order_index - b.order_index)
        })))
      }

      // Set user flags
      setIsEnrolled(!!enrRes.data || profile?.role === 'admin')
      setWishlistAdded(!!wlRes.data)

      setLoading(false)
    }

    load()
  }, [productId, user, profile, navigate])

  const handleEnrollOrBuy = () => {
    if (product?.is_free) {
      if (!user) {
        navigate(`/register?redirect=/dashboard&product=${product.id}`)
      } else {
        // Enroll for free
        supabase.from('enrollments')
          .upsert({ user_id: user.id, course_id: product.id, progress: [] })
          .then(() => navigate('/dashboard'))
      }
    } else {
      navigate(`/checkout?product=${product.id}`)
    }
  }

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (wishlistAdded) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id)
      setWishlistAdded(false)
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id })
      setWishlistAdded(true)
    }
  }

  const getVideoSource = (url) => {
    if (!url) return null
    const trimmed = url.trim()

    // First check if it is Wistia embed code or URL
    const wistiaMatch = trimmed.match(/wistia_async_([a-zA-Z0-9]+)/) ||
                        trimmed.match(/embed\/medias\/([a-zA-Z0-9]+)\.jsonp/) ||
                        trimmed.match(/wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/) ||
                        trimmed.match(/fast\.wistia\.(?:com|net)\/embed\/iframe\/([a-zA-Z0-9]+)/);
    if (wistiaMatch) {
      return { type: 'wistia', id: wistiaMatch[1] }
    }

    // If it's an iframe code or script tag code
    if (trimmed.startsWith('<iframe') || trimmed.startsWith('<script') || trimmed.includes('<div class="wistia_embed"')) {
      return { type: 'embedCode', code: trimmed }
    }

    // 1. YouTube Matcher
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      const ytMatch = trimmed.match(ytRegex)
      if (ytMatch) {
        return { type: 'youtube', id: ytMatch[1] }
      }
    }

    // 2. Vimeo Matcher
    if (trimmed.includes('vimeo.com')) {
      const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|showcase\/(\d+)\/video\/|video\/|)(\d+)/
      const vimeoMatch = trimmed.match(vimeoRegex)
      if (vimeoMatch) {
        return { type: 'vimeo', id: vimeoMatch[4] }
      }
    }

    // 3. Wistia Matcher
    if (trimmed.includes('wistia.com') || trimmed.includes('wistia.net')) {
      const match = trimmed.match(/(?:medias|iframe|medias)\/([a-zA-Z0-9]+)/) || trimmed.match(/wistia\.com\/medias\/([a-zA-Z0-9]+)/)
      if (match) {
        return { type: 'wistia', id: match[1] }
      }
      // Fallback: search for any 10-char alphanumeric sequence at the end of the URL
      const lastPart = trimmed.split('/').pop().split('?')[0]
      if (/^[a-zA-Z0-9]{10}$/.test(lastPart)) {
        return { type: 'wistia', id: lastPart }
      }
    }

    // 4. Direct video files
    if (/\.(mp4|webm|ogg|mov|m4v)(?:\?|$)/i.test(trimmed)) {
      return { type: 'raw', url: trimmed }
    }

    return null
  }

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#050b14', color: '#fff',
        fontFamily: "var(--font)", zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {/* Ambient glow behind the logo */}
          <div style={{ position: 'absolute', width: 160, height: 160, background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(24px)', animation: 'ambient-glow 3s ease-in-out infinite' }} />
          
          {/* Pulse-animated Logo */}
          <img src="/logo.png" alt="Amplified Skills" style={{ height: 64, width: 'auto', maxWidth: 220, objectFit: 'contain', marginBottom: 36, filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.15))', animation: 'logo-pulse 2.2s ease-in-out infinite' }} />
          
          {/* Premium Circular Glowing Spinner */}
          <div className="premium-spinner" />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '14px', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>Loading product details...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .premium-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.05);
            border-top-color: #2563eb;
            border-right-color: #3b82f6;
            border-radius: 50%;
            animation: spin-loader 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          @keyframes spin-loader {
            to { transform: rotate(360deg); }
          }
          @keyframes logo-pulse {
            0%, 100% { transform: scale(1); opacity: 0.85; filter: drop-shadow(0 0 8px rgba(37,99,235,0.1)); }
            50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 16px rgba(37,99,235,0.4)); }
          }
          @keyframes ambient-glow {
            0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }
            50% { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
          }
        `}} />
      </div>
    )
  }

  if (!product) return null

  const features = Array.isArray(product.features) ? product.features : []
  const isCourse = product.type === 'course'
  const isFree = product.is_free || product.price === 0
  const whatYouLearn = Array.isArray(courseData?.what_you_learn) ? courseData.what_you_learn : []
  const requirements = Array.isArray(courseData?.requirements) ? courseData.requirements : []
  const whoIsFor = Array.isArray(courseData?.who_is_for) ? courseData.who_is_for : []
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)

  const priceDisplay = isFree ? 'FREE' : `₦${product.price?.toLocaleString()}`
  const oldPriceDisplay = product.old_price ? `₦${product.old_price?.toLocaleString()}` : null

  const ctaLabel = isEnrolled
    ? 'Continue Learning →'
    : isFree
      ? 'Enroll for Free'
      : 'Get Instant Access'

  const ctaAction = isEnrolled
    ? () => navigate(`/course/${product?.id}`)
    : handleEnrollOrBuy

  const previewVideo = courseData?.preview_video || product?.preview_video || null

  const capSvg = (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  )

  const bookSvg = (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )

  return (
    <div className="pd-root public-layout-root">
      {/* SaaS Hero Banner */}
      <div className="pd-hero-banner">
        <div className="pd-hero-container">
          <div className="pd-hero-left">
            <div className="pd-breadcrumbs">
              <Link to="/products">All Products</Link>
              <span className="pd-separator">/</span>
              <span>{isCourse ? 'Courses' : 'E-Books'}</span>
              <span className="pd-separator">/</span>
              <span className="pd-active-crumb">{product.title.replace(/\s+slug$/i, '')}</span>
            </div>

            {isFree && <div className="pd-free-tag">FREE</div>}
            {!isFree && !isCourse && (
              <div className="pd-badge-bestseller">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 5, display: 'inline-block', verticalAlign: 'middle' }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Best Seller
              </div>
            )}

            <h1 className="pd-title">{product.title.replace(/\s+slug$/i, '')}</h1>
            <p className="pd-subtitle" style={{ whiteSpace: 'pre-wrap' }}>{product.short_description || getShortDesc(product)}</p>

            <div className="pd-meta-row">
              <StarRating rating={reviewsAvg} count={reviewsCount} />
              {isCourse && courseData?.level && (
                <span className="pd-meta-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 5, display: 'inline-block', verticalAlign: 'middle' }}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  {courseData.level.charAt(0).toUpperCase() + courseData.level.slice(1)}
                </span>
              )}
              {isCourse && totalLessons > 0 && (
                <span className="pd-meta-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 5, display: 'inline-block', verticalAlign: 'middle' }}>
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  {totalLessons} lessons
                </span>
              )}
              {isCourse && courseData?.language && (
                <span className="pd-meta-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 5, display: 'inline-block', verticalAlign: 'middle' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  {courseData.language}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="pd-main-wrap">
        <div className="pd-columns-grid">
          {/* Left Column (7/12 ratio) */}
          <div className="pd-column-left">
            
            {/* Mobile Video Preview Card */}
            <div className="pd-mobile-preview-card">
              <div className="pd-sidebar-preview">
                {product.cover_image ? (
                  <img src={product.cover_image} alt={product.title.replace(/\s+slug$/i, '')} className="pd-preview-img" />
                ) : (
                  <div className="pd-preview-placeholder">{isCourse ? capSvg : bookSvg}</div>
                )}
                
                {previewVideo && (
                  <button className="pd-play-overlay" onClick={() => setShowVideoModal(true)}>
                    <div className="pd-play-button-outer">
                      <div className="pd-play-button-inner">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                    </div>
                    <span className="pd-play-text">Preview this {isCourse ? 'course' : 'product'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* "What You'll Learn" Section */}
            {(whatYouLearn.length > 0 || features.length > 0) && (
              <div className="pd-card pd-card-learn">
                <h2 className="pd-card-title">What You'll Learn</h2>
                <div className="pd-learn-grid">
                  {(whatYouLearn.length > 0 ? whatYouLearn : features).map((item, i) => (
                    <div key={i} className="pd-learn-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--g500)" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Curriculum Accordion */}
            {isCourse && modules.length > 0 && (
              <div className="pd-card pd-card-curriculum">
                <h2 className="pd-card-title">Course Curriculum</h2>
                <div className="pd-curriculum-meta">
                  {modules.length} sections • {totalLessons} lessons
                </div>
                <div className="pd-accordion">
                  {modules.map((mod, mi) => {
                    const isOpen = openModule === mi
                    return (
                      <div key={mod.id} className="pd-accordion-item">
                        <button
                          className={`pd-accordion-header ${isOpen ? 'active' : ''}`}
                          onClick={() => setOpenModule(isOpen ? -1 : mi)}
                        >
                          <span className="pd-accordion-title">
                            <svg className={`pd-chevron ${isOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                            {mod.title}
                          </span>
                          <span className="pd-accordion-count">{mod.lessons?.length || 0} lessons</span>
                        </button>
                        {isOpen && (
                          <div className="pd-lessons-list">
                            {mod.lessons?.map((les) => (
                              <div key={les.id} className="pd-lesson-row">
                                <div className="pd-lesson-left">
                                  <span className="pd-lesson-icon">
                                    {les.is_free_preview ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g500)" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    ) : les.type === 'article' ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                    )}
                                  </span>
                                  <span className={`pd-lesson-title ${les.is_free_preview ? 'preview' : ''}`}>{les.title}</span>
                                  {les.is_free_preview && <span className="pd-free-badge-inline">Free Preview</span>}
                                </div>
                                {les.video_duration && (
                                  <span className="pd-lesson-duration">
                                    {Math.floor(les.video_duration / 60)}:{String(les.video_duration % 60).padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="pd-card pd-card-desc">
              <h2 className="pd-card-title">About This {isCourse ? 'Course' : 'Product'}</h2>
              {product.description && product.description.includes('<') ? (
                <div className="pd-desc-content wysiwyg-content-area" dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <div className="pd-desc-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </div>
              )}
            </div>

            {/* Requirements & Who is this for */}
            {requirements.length > 0 && (
              <div className="pd-card pd-card-requirements">
                <h2 className="pd-card-title">Requirements</h2>
                <ul className="pd-list-checkmark">
                  {requirements.map((r, i) => (
                    <li key={i}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g500)" strokeWidth="3" style={{ marginRight: 8, flexShrink: 0, marginTop: 4 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {whoIsFor.length > 0 && (
              <div className="pd-card pd-card-who">
                <h2 className="pd-card-title">Who is this for?</h2>
                <ul className="pd-list-checkmark">
                  {whoIsFor.map((w, i) => (
                    <li key={i}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--g500)" strokeWidth="3" style={{ marginRight: 8, flexShrink: 0, marginTop: 4 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column (Sticky Desktop Sidebar, 5/12 ratio) */}
          <div className="pd-column-right">
            <div className="pd-sidebar-card">
              {/* Cover visual & Play trigger */}
              <div className="pd-sidebar-preview">
                {product.cover_image ? (
                  <img src={product.cover_image} alt={product.title.replace(/\s+slug$/i, '')} className="pd-preview-img" />
                ) : (
                  <div className="pd-preview-placeholder">{isCourse ? capSvg : bookSvg}</div>
                )}
                
                {previewVideo && (
                  <button className="pd-play-overlay" onClick={() => setShowVideoModal(true)}>
                    <div className="pd-play-button-outer">
                      <div className="pd-play-button-inner">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                    </div>
                    <span className="pd-play-text">Preview this {isCourse ? 'course' : 'product'}</span>
                  </button>
                )}
              </div>

              {/* Purchase Details */}
              <div className="pd-sidebar-info">
                <div className="pd-sidebar-price-row">
                  {isFree ? (
                    <span className="pd-price-free">FREE</span>
                  ) : (
                    <>
                      <span className="pd-price-main">₦{product.price?.toLocaleString()}</span>
                      {oldPriceDisplay && <span className="pd-price-old">{oldPriceDisplay}</span>}
                      {oldPriceDisplay && (
                        <span className="pd-discount-tag">
                          {Math.round((1 - product.price / product.old_price) * 100)}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="pd-sidebar-ctas">
                  <button className="pd-cta-primary" onClick={ctaAction}>
                    {ctaLabel}
                  </button>

                  <button className={`pd-cta-secondary ${wishlistAdded ? 'wishlisted' : ''}`} onClick={toggleWishlist}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlistAdded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{wishlistAdded ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                </div>

                <div className="pd-guarantee-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>30-Day Money-Back Guarantee</span>
                </div>

                <div className="pd-sidebar-includes">
                  <h3 className="pd-includes-heading">This {isCourse ? 'course' : 'e-book'} includes:</h3>
                  <ul className="pd-includes-list">
                    {isCourse && (
                      <>
                        {totalLessons > 0 && (
                          <li>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                              <polygon points="12 8 12 16 18 12 12 8" />
                            </svg>
                            {totalLessons} on-demand lessons
                          </li>
                        )}
                        <li>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          Full lifetime access
                        </li>
                        <li>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                            <line x1="12" y1="18" x2="12.01" y2="18" />
                          </svg>
                          Access on mobile & desktop
                        </li>
                        <li>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Certificate of completion
                        </li>
                      </>
                    )}
                    {!isCourse && (
                      <>
                        <li>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <polyline points="9 15 12 18 15 15" />
                          </svg>
                          Instant PDF download
                        </li>
                        <li>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          Direct delivery to email
                        </li>
                        <li>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                          Lifetime updates & access
                        </li>
                      </>
                    )}
                    {features.map((f, i) => (
                      <li key={i}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" style={{ marginRight: 8, flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="pd-mobile-footer-cta">
        {!isEnrolled && (
          <div className="pd-mobile-footer-price">
            {isFree ? (
              <span className="pd-price-free">FREE</span>
            ) : (
              <div className="pd-price-mobile-row">
                <span className="pd-price-main-mobile">₦{product.price?.toLocaleString()}</span>
                {oldPriceDisplay && <span className="pd-price-old-mobile">{oldPriceDisplay}</span>}
              </div>
            )}
          </div>
        )}
        <button 
          className="pd-cta-primary pd-mobile-btn" 
          onClick={ctaAction}
          style={isEnrolled ? { maxWidth: 'none', width: '100%' } : {}}
        >
          {ctaLabel}
        </button>
      </div>

      {/* Full-Screen Video Lightbox Modal */}
      {showVideoModal && previewVideo && (
        <div className="pd-modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="pd-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="pd-modal-close" onClick={() => setShowVideoModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="pd-modal-video-container">
              {(() => {
                const source = getVideoSource(previewVideo)
                if (!source) {
                  return (
                    <div style={{ color: '#fff', textAlign: 'center', padding: '40px 20px', fontFamily: 'sans-serif' }}>
                      <p style={{ fontSize: 16, marginBottom: 12 }}>Unsupported or invalid preview video configured.</p>
                      <p style={{ fontSize: 13, color: '#94a3b8' }}>URL: {previewVideo}</p>
                    </div>
                  )
                }
                if (source.type === 'youtube') {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${source.id}?autoplay=1&rel=0`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="pd-video-iframe"
                    />
                  )
                }
                if (source.type === 'vimeo') {
                  return (
                    <iframe
                      src={`https://player.vimeo.com/video/${source.id}?autoplay=1`}
                      title="Vimeo video player"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="pd-video-iframe"
                    />
                  )
                }
                if (source.type === 'wistia') {
                  return (
                    <iframe
                      src={`https://fast.wistia.net/embed/iframe/${source.id}?videoFoam=true&autoplay=true&doNotTrack=true`}
                      title="Wistia video player"
                      allow="autoplay; fullscreen"
                      allowtransparency="true"
                      frameBorder="0"
                      scrolling="no"
                      className="wistia_embed pd-video-iframe"
                      name="wistia_embed"
                      msallowfullscreen="true"
                    />
                  )
                }
                if (source.type === 'embedCode') {
                  return (
                    <div 
                      className="pd-video-iframe"
                      dangerouslySetInnerHTML={{ __html: source.code }} 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }} 
                    />
                  )
                }
                if (source.type === 'raw') {
                  return (
                    <video
                      src={source.url}
                      controls
                      autoPlay
                      className="pd-video-element"
                    />
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>
      )}

      {/* CSS Styling */}
      <style>{`
        .pd-root {
          font-family: var(--font);
          background: #fdfdfd;
          min-height: 100vh;
          color: #1e293b;
        }

        /* ── HERO BANNER ── */
        .pd-hero-banner {
          background: radial-gradient(circle at 0% 0%, var(--g800) 0%, var(--g900) 100%);
          padding: 80px 24px 96px;
          position: relative;
          color: #fff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }
        .pd-hero-banner::before {
          content: '';
          position: absolute;
          top: -20%;
          right: -10%;
          width: 50%;
          height: 60%;
          background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 70%);
          filter: blur(80px);
          pointer-events: none;
        }
        .pd-hero-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 48px;
          align-items: flex-start;
          position: relative;
          z-index: 2;
        }
        .pd-hero-left {
          flex: 1;
          max-width: 760px;
          min-width: 0;
        }

        .pd-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .pd-breadcrumbs a {
          color: rgba(255, 255, 255, 0.75);
          transition: all 0.2s ease;
          font-weight: 500;
          text-decoration: none;
        }
        .pd-breadcrumbs a:hover {
          color: var(--g400);
          text-decoration: underline;
        }
        .pd-separator {
          color: rgba(255, 255, 255, 0.2);
        }
        .pd-active-crumb {
          font-weight: 400;
          color: rgba(255, 255, 255, 0.4);
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pd-free-tag {
          display: inline-block;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          padding: 6px 18px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 20px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        .pd-badge-premium {
          display: inline-block;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 6px 18px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 20px;
        }
        .pd-badge-bestseller {
          display: inline-block;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.05));
          color: var(--g400);
          border: 1px solid rgba(37, 99, 235, 0.3);
          padding: 6px 18px;
          border-radius: 50px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 20px;
        }

        .pd-title {
          font-family: var(--font-heading) !important;
          font-size: clamp(2.4rem, 6vw, 3.4rem);
          font-weight: 950;
          color: #fff;
          line-height: 1.15;
          margin: 0 0 20px;
          letter-spacing: -1.5px;
          background: linear-gradient(to right, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pd-subtitle {
          font-size: 0.97rem;
          color: #94a3b8;
          line-height: 1.65;
          margin: 0 0 28px;
          max-width: 680px;
          font-weight: 400;
        }

        .pd-meta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .pd-meta-badge {
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.85);
          padding: 5px 12px;
          border-radius: 30px;
          font-size: 11.5px;
          font-weight: 600;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(4px);
          white-space: nowrap;
        }

        /* ── MAIN COLUMNS GRID ── */
        .pd-main-wrap {
          max-width: 1200px;
          margin: -40px auto 0;
          padding: 0 24px 96px;
          position: relative;
          z-index: 5;
        }
        .pd-columns-grid {
          display: grid;
          grid-template-columns: 7fr 5fr;
          gap: 40px;
          align-items: flex-start;
        }

        .pd-column-left {
          min-width: 0;
        }

        /* ── CARD STYLES ── */
        .pd-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 36px;
          margin-bottom: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 20px 25px -5px rgba(0, 0, 0, 0.01), inset 0 1px 0 0 rgba(255, 255, 255, 0.8);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pd-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
        }
        .pd-card-title {
          font-family: var(--font-heading) !important;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 24px;
          padding-bottom: 18px;
          border-bottom: 2px solid #f8fafc;
          position: relative;
          letter-spacing: -0.5px;
        }
        .pd-card-title::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 50px;
          height: 3px;
          background: linear-gradient(to right, var(--g600), var(--g500));
          border-radius: 4px;
        }

        .pd-learn-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .pd-learn-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14.5px;
          color: #475569;
          line-height: 1.6;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 14px;
          border: 1px solid #f1f5f9;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .pd-learn-item:hover {
          border-color: var(--g500);
          background: var(--g50);
          transform: scale(1.01);
        }
        .pd-learn-item svg {
          flex-shrink: 0;
          margin-top: 3.5px;
          stroke: var(--g500);
        }

        /* ── ACCORDION CURRICULUM ── */
        .pd-curriculum-meta {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 20px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .pd-accordion {
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
        }
        .pd-accordion-item {
          border-bottom: 1px solid #f1f5f9;
        }
        .pd-accordion-item:last-child {
          border-bottom: none;
        }
        .pd-accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 20px 24px;
          background: #f8fafc;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .pd-accordion-header:hover {
          background: #f1f5f9;
        }
        .pd-accordion-header.active {
          background: #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
        }
        .pd-accordion-title {
          font-family: var(--font);
          font-weight: 700;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
        }
        .pd-chevron {
          color: #64748b;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .pd-chevron.open {
          transform: rotate(180deg);
        }
        .pd-accordion-count {
          font-size: 13.5px;
          color: #64748b;
          font-weight: 600;
        }
        .pd-lessons-list {
          background: #fff;
          padding: 8px 0;
        }
        .pd-lesson-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #f8fafc;
          transition: all 0.2s ease;
        }
        .pd-lesson-row:last-child {
          border-bottom: none;
        }
        .pd-lesson-row:hover {
          background: var(--g50);
        }
        .pd-lesson-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .pd-lesson-icon {
          color: var(--g500);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pd-lesson-title {
          font-size: 14.5px;
          color: #334155;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pd-lesson-title.preview {
          color: var(--g600);
          font-weight: 700;
        }
        .pd-free-badge-inline {
          font-size: 10px;
          background: rgba(37, 99, 235, 0.08);
          color: var(--g600);
          border: 1px solid rgba(37, 99, 235, 0.2);
          border-radius: 6px;
          padding: 2px 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .pd-lesson-duration {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        /* ── DESCRIPTION CONTENT ── */
        .pd-desc-content {
          font-size: 15.5px;
          line-height: 1.8;
          color: #475569;
        }

        /* ── BULLET & CHECK LISTS ── */
        .pd-list-checkmark {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pd-list-checkmark li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 15px;
          color: #334155;
          line-height: 1.6;
          font-weight: 500;
        }
        .pd-list-bullet {
          color: #10b981;
          font-weight: 900;
          font-size: 16px;
          flex-shrink: 0;
        }

        /* ── DETECT MOBILE CARD ── */
        .pd-mobile-preview-card {
          display: none;
        }

        /* ── STICKY SIDEBAR CARD ── */
        .pd-column-right {
          position: sticky;
          top: 32px;
          z-index: 10;
        }
        .pd-sidebar-card {
          background: #fff;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05);
          position: relative;
        }
        .pd-sidebar-preview {
          position: relative;
          width: 100%;
          aspect-ratio: 16/10;
          min-height: 220px;
          background: #090d16;
          overflow: hidden;
          border-bottom: 1px solid #f1f5f9;
        }
        .pd-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pd-sidebar-preview:hover .pd-preview-img {
          transform: scale(1.05);
        }
        .pd-preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 72px;
          background: radial-gradient(circle at center, #1e1b4b 0%, #090d16 100%);
        }

        .pd-play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s ease;
          border: none;
          width: 100%;
          height: 100%;
        }
        .pd-play-overlay:hover {
          background: rgba(15, 23, 42, 0.6);
        }

        .pd-play-button-outer {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
          transition: all 0.3s ease;
        }
        .pd-play-overlay:hover .pd-play-button-outer {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 0.25);
        }
        .pd-play-button-inner {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          color: var(--g600);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
          padding-left: 3px; /* visual alignment */
          transition: transform 0.2s ease;
        }
        .pd-play-overlay:hover .pd-play-button-inner {
          transform: scale(1.05);
        }
        .pd-play-text {
          margin-top: 16px;
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          letter-spacing: 0.5px;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
          }
          70% {
            transform: scale(1.02);
            box-shadow: 0 0 0 18px rgba(255, 255, 255, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
          }
        }

        .pd-sidebar-info {
          padding: 32px;
        }

        .pd-sidebar-price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .pd-price-main {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -1.5px;
        }
        .pd-price-free {
          font-family: var(--font-heading);
          font-size: 36px;
          font-weight: 900;
          color: #10b981;
          letter-spacing: -1.5px;
        }
        .pd-price-old {
          font-size: 18px;
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 500;
        }
        .pd-discount-tag {
          background: #fef2f2;
          color: #ef4444;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid #fee2e2;
          letter-spacing: 0.2px;
        }

        .pd-sidebar-ctas {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .pd-cta-primary {
          display: block;
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, var(--g600) 0%, var(--g500) 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.3);
          letter-spacing: 0.5px;
        }
        .pd-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(37, 99, 235, 0.5);
          background: linear-gradient(135deg, var(--g700) 0%, var(--g600) 100%);
        }
        .pd-cta-primary:active {
          transform: translateY(0);
        }

        .pd-cta-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          background: transparent;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pd-cta-secondary:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: #fef2f2;
        }
        .pd-cta-secondary.wishlisted {
          border-color: #ef4444;
          color: #ef4444;
          background: #fef2f2;
        }

        .pd-guarantee-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          color: #64748b;
          padding: 20px 0 0;
          border-top: 1px solid #f1f5f9;
          margin-top: 24px;
          font-weight: 600;
        }
        .pd-guarantee-badge svg {
          color: #10b981;
          flex-shrink: 0;
        }

        .pd-sidebar-includes {
          margin-top: 28px;
        }
        .pd-includes-heading {
          font-size: 11.5px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 14px;
        }
        .pd-includes-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pd-includes-list li {
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }

        /* ── MOBILE FIXED FOOTER CTA ── */
        .pd-mobile-footer-cta {
          display: none;
        }

        /* ── MODAL LIGHTBOX ── */
        .pd-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(5, 11, 20, 0.9);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 24px;
        }
        .pd-modal-content {
          position: relative;
          width: 100%;
          max-width: 960px;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pd-modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2010;
        }
        .pd-modal-close:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: rotate(90deg);
        }
        .pd-modal-video-container {
          width: 100%;
          height: 100%;
        }
        .pd-video-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .pd-video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        /* ── LOADING SPINNER ── */
        .pd-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: var(--g500);
          border-radius: 50%;
          animation: pd-spin 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          margin: 0 auto;
        }
        @keyframes pd-spin {
          to { transform: rotate(360deg); }
        }

        /* ── RESPONSIVE MEDIA QUERIES ── */
        @media (max-width: 1024px) {
          .pd-columns-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .pd-column-right {
            display: none;
          }
          .pd-mobile-preview-card {
            display: block;
            margin: 0 0 32px 0;
            border-radius: 16px;
            overflow: hidden;
            background: #fff;
            border: none;
            box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
          }
          .pd-hero-banner {
            padding: 64px 20px 72px;
          }
          .pd-main-wrap {
            padding: 0 20px 120px; /* spacing for sticky footer */
            margin-top: -32px;
          }
          .pd-mobile-footer-cta {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(241, 245, 249, 0.9);
            padding: 14px 20px;
            align-items: center;
            justify-content: space-between;
            z-index: 999;
            box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.05);
          }
          .pd-mobile-footer-price {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .pd-mobile-price-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            font-weight: 700;
          }
          .pd-price-mobile-row {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          .pd-price-main-mobile {
            font-family: var(--font-heading);
            font-size: 26px;
            font-weight: 900;
            color: #0f172a;
          }
          .pd-price-old-mobile {
            font-size: 15px;
            color: #94a3b8;
            text-decoration: line-through;
            font-weight: 500;
          }
          .pd-mobile-btn {
            flex: 1;
            max-width: 240px;
          }
        }

        @media (max-width: 640px) {
          .pd-learn-grid {
            grid-template-columns: 1fr;
          }
          .pd-card {
            padding: 28px 20px;
          }
          .pd-card-title {
            font-size: 1.3rem;
          }
          .pd-accordion-header {
            padding: 18px;
          }
          .pd-lesson-row {
            padding: 14px 18px;
          }
          .pd-subtitle {
            font-size: 0.9rem;
          }
          .pd-meta-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px 8px;
            width: 100%;
          }
          .pd-meta-row > *:first-child {
            grid-column: span 3;
            margin-bottom: 2px;
          }
          .pd-meta-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px 4px;
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        /* WYSIWYG Content Styles */
        .wysiwyg-content-area {
          font-size: 15px;
          line-height: 1.65;
          color: #e2e8f0;
        }
        .wysiwyg-content-area h2 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #ffffff;
        }
        .wysiwyg-content-area h3 {
          font-size: 1.3rem;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #ffffff;
        }
        .wysiwyg-content-area p {
          margin-bottom: 1.2em;
          color: rgba(255, 255, 255, 0.8);
        }
        .wysiwyg-content-area ul {
          list-style-type: disc;
          padding-left: 24px;
          margin-bottom: 1.2em;
        }
        .wysiwyg-content-area ol {
          list-style-type: decimal;
          padding-left: 24px;
          margin-bottom: 1.2em;
        }
        .wysiwyg-content-area li {
          margin-bottom: 0.4em;
          color: rgba(255, 255, 255, 0.85);
        }
        .wysiwyg-content-area a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .wysiwyg-content-area a:hover {
          color: #60a5fa;
        }
      `}</style>
    </div>
  )
}
