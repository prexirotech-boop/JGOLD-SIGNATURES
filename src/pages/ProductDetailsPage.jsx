import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CONFIG } from '../lib/config'

export default function ProductDetailsPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wishlistAdded, setWishlistAdded] = useState(false)
  const [reviewsAvg, setReviewsAvg] = useState(4.9)
  const [reviewsCount, setReviewsCount] = useState(12)
  const [activeImage, setActiveImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [addedToCartToast, setAddedToCartToast] = useState(false)
  const [activeTab, setActiveTab] = useState('description')

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
      setActiveImage(prod.cover_image || '/logo.png')

      // Pre-select first options of variations if available
      if (prod.variations?.attributes && prod.variations.attributes.length > 0) {
        const initial = {}
        prod.variations.attributes.forEach(attr => {
          if (attr.options && attr.options.length > 0) {
            initial[attr.name] = attr.options[0]
          }
        })
        setSelectedAttributes(initial)
      }

      // Fetch reviews and wishlist concurrently
      const promises = [
        supabase.from('reviews').select('rating').eq('course_id', prod.id),
        user ? supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', prod.id).maybeSingle() : Promise.resolve({ data: null })
      ]

      const [revsRes, wlRes] = await Promise.all(promises)
      
      const revs = revsRes.data
      if (revs && revs.length > 0) {
        const sum = revs.reduce((acc, r) => acc + r.rating, 0)
        setReviewsAvg(sum / revs.length)
        setReviewsCount(revs.length)
      }

      setWishlistAdded(!!wlRes.data)
      setLoading(false)
    }

    load()
  }, [productId, user, navigate])

  // Synchronize variant selection
  useEffect(() => {
    if (!product?.variations?.variants) return
    const variants = product.variations.variants
    
    // Find variant matching selected attributes
    const match = variants.find(variant => {
      return Object.entries(selectedAttributes).every(([attrName, value]) => {
        return variant.attributes && variant.attributes[attrName] === value
      })
    })

    if (match) {
      setSelectedVariant(match)
      if (match.image) {
        setActiveImage(match.image)
      }
    } else {
      setSelectedVariant(null)
    }
  }, [selectedAttributes, product])

  const toggleWishlist = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      if (wishlistAdded) {
        await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id)
        setWishlistAdded(false)
      } else {
        await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id })
        setWishlistAdded(true)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    try {
      const cartKey = 'ecom_cart'
      let cart = JSON.parse(localStorage.getItem(cartKey)) || []
      
      const finalPrice = selectedVariant ? selectedVariant.price : product.price
      const finalOldPrice = selectedVariant ? selectedVariant.compare_price : product.old_price
      const finalImage = selectedVariant?.image || product.cover_image
      
      const titleExtension = selectedVariant
        ? ` (${Object.values(selectedVariant.attributes).join(', ')})`
        : ''

      // Remove item if same ID and variant ID exists to prevent duplicating
      cart = cart.filter(item => !(item.id === product.id && item.variant_id === (selectedVariant?.id || null)))

      cart.push({
        id: product.id,
        variant_id: selectedVariant?.id || null,
        title: `${product.title.replace(/\s+slug$/i, '')}${titleExtension}`,
        price: finalPrice,
        old_price: finalOldPrice,
        cover_image: finalImage,
        type: product.type,
        slug: product.slug,
        quantity: quantity
      })

      localStorage.setItem(cartKey, JSON.stringify(cart))
      window.dispatchEvent(new Event('cart_updated'))
      
      setAddedToCartToast(true)
      setTimeout(() => setAddedToCartToast(false), 3000)
    } catch (err) {
      console.error('[ProductDetailsPage] Error adding to cart:', err)
    }
  }

  const handleBuyNow = () => {
    handleAddToCart()
    const variantQuery = selectedVariant ? `&variant=${selectedVariant.id}` : ''
    navigate(`/checkout?product=${product.id}${variantQuery}`)
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', fontFamily: "var(--font)", zIndex: 9999 }}>
        <img src="/logo.png" alt="MIFAS FARMS" style={{ height: 60, width: 'auto', marginBottom: 24 }} />
        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', marginTop: 16, fontSize: '14px' }}>Loading product details...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!product) return null

  // Images list (Cover image + optional uploader images list)
  const imagesList = [
    product.cover_image,
    ...(Array.isArray(product.images) ? product.images : [])
  ].filter(Boolean)

  const finalPrice = selectedVariant ? selectedVariant.price : product.price
  const finalComparePrice = selectedVariant ? selectedVariant.compare_price : product.old_price
  const isOutOfStock = selectedVariant
    ? (selectedVariant.stock !== null && selectedVariant.stock <= 0)
    : (product.stock_quantity !== null && product.stock_quantity <= 0)

  const discountPercent = finalComparePrice && finalPrice
    ? Math.round((1 - finalPrice / finalComparePrice) * 100)
    : null

  const features = Array.isArray(product.features) ? product.features : []

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b', padding: '40px 24px' }}>
      
      {/* ─── BREADCRUMBS ─── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px', fontSize: '13px', display: 'flex', gap: '8px', color: '#64748b', fontWeight: 500 }} className="breadcrumbs">
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none' }}>Home</Link>
        <span>/</span>
        <Link to="/products" style={{ color: '#64748b', textDecoration: 'none' }}>Products</Link>
        <span>/</span>
        <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{product.title.replace(/\s+slug$/i, '')}</span>
      </div>

      {/* ─── TWO COLUMN E-COMMERCE GRID ─── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }} className="product-details-grid">
        
        {/* Left Column: Media Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '400px',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
          }}>
            <img 
              src={activeImage} 
              alt={product.title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onError={e => { e.currentTarget.src = '/logo.png'; e.currentTarget.style.padding = '40px' }}
            />
          </div>

          {/* Thumbnails Row */}
          {imagesList.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {imagesList.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: activeImage === img ? '2px solid var(--brand-primary)' : '1px solid #cbd5e1',
                    background: '#f8fafc',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Details Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            {/* Stock Tag */}
            <span style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11.5px',
              fontWeight: 800,
              background: isOutOfStock ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: isOutOfStock ? '#ef4444' : '#10b981',
              border: isOutOfStock ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
              marginBottom: '12px'
            }}>
              {isOutOfStock ? '🔴 Out of Stock' : '🟢 In Stock'}
            </span>

            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
              {product.title.replace(/\s+slug$/i, '')}
            </h1>
            
            {/* Reviews Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.floor(reviewsAvg) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{reviewsAvg.toFixed(1)} ({reviewsCount} customer reviews)</span>
            </div>
          </div>

          {/* Pricing Panel */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', background: '#f8fafc', padding: '16px', borderRadius: '6px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#0d2e1a' }}>
              ₦{finalPrice?.toLocaleString()}
            </span>
            {finalComparePrice && (
              <span style={{ fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through' }}>
                ₦{finalComparePrice?.toLocaleString()}
              </span>
            )}
            {discountPercent && (
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', background: 'rgba(22,163,74,0.1)', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>
                {discountPercent}% OFF
              </span>
            )}
          </div>

          <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
            {product.short_description || (product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : '')}
          </p>

          {/* ─── ATTRIBUTES SELECTORS (WooCommerce-Style) ─── */}
          {product.variations?.attributes && product.variations.attributes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {product.variations.attributes.map(attr => (
                <div key={attr.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
                    Select {attr.name}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {attr.options?.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelectedAttributes({ ...selectedAttributes, [attr.name]: opt })}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: selectedAttributes[attr.name] === opt ? '2px solid var(--brand-primary)' : '1px solid #cbd5e1',
                          background: selectedAttributes[attr.name] === opt ? 'rgba(18,60,36,0.04)' : '#ffffff',
                          color: selectedAttributes[attr.name] === opt ? 'var(--brand-primary)' : '#1f2937',
                          transition: 'all 0.1s ease'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ─── QUANTITY AND BUY CONTROLS ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Quantity</span>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', height: '38px', overflow: 'hidden' }}>
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '32px', height: '100%', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}>-</button>
                  <span style={{ width: '40px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} style={{ width: '32px', height: '100%', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 800 }}>+</button>
                </div>
              </div>

              {/* Add to Wishlist Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Wishlist</span>
                <button
                  onClick={toggleWishlist}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '4px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: wishlistAdded ? '#ef4444' : '#475569'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={wishlistAdded ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  {wishlistAdded ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '6px' }}>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  background: 'transparent',
                  color: 'var(--brand-primary)',
                  border: '2px solid var(--brand-primary)',
                  height: '44px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  opacity: isOutOfStock ? 0.5 : 1
                }}
                onMouseEnter={e => { if(!isOutOfStock) e.currentTarget.style.background = 'rgba(18,60,36,0.04)' }}
                onMouseLeave={e => { if(!isOutOfStock) e.currentTarget.style.background = 'transparent' }}
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                style={{
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  border: 'none',
                  height: '44px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                  opacity: isOutOfStock ? 0.5 : 1
                }}
                onMouseEnter={e => { if(!isOutOfStock) e.currentTarget.style.background = 'var(--brand-hover)' }}
                onMouseLeave={e => { if(!isOutOfStock) e.currentTarget.style.background = 'var(--brand-primary)' }}
              >
                Buy Now <span>→</span>
              </button>
            </div>
          </div>

          {/* Product Meta Data list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <span><strong>Weight (kg):</strong> {selectedVariant?.weight || product.weight || 'N/A'}</span>
            <span><strong>Category:</strong> {product.type === 'physical' ? 'Agricultural Exports' : 'Resources'}</span>
            <span><strong>SKU:</strong> MIFAS-{product.id.substring(0, 8).toUpperCase()}</span>
          </div>

        </div>

      </div>

      {/* Added to Cart Success Notification */}
      {addedToCartToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0d2e1a',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13.5px',
          fontWeight: 700,
          animation: 'slideUp 0.3s ease'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          Product successfully added to your cart!
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* ─── BELOW THE FOLD TABS ─── */}
      <section style={{ maxWidth: '1200px', margin: '48px auto 0', borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #cbd5e1', marginBottom: '20px' }}>
          {[
            { id: 'description', label: 'Description' },
            { id: 'specifications', label: 'Additional Information' },
            { id: 'reviews', label: 'Reviews' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                paddingBottom: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--brand-primary)' : '#64748b',
                borderBottom: activeTab === tab.id ? '3px solid var(--brand-primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ minHeight: '120px', lineHeight: '1.7', fontSize: '14px', color: '#334155' }}>
          {activeTab === 'description' && (
            <div dangerouslySetInnerHTML={{ __html: product.description || 'No description provided.' }} />
          )}

          {activeTab === 'specifications' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '500px' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', fontWeight: 700, color: '#0d2e1a', width: '140px' }}>Weight</td>
                  <td style={{ padding: '8px 0' }}>{selectedVariant?.weight || product.weight || 'N/A'} kg</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', fontWeight: 700, color: '#0d2e1a' }}>Packaging</td>
                  <td style={{ padding: '8px 0' }}>Export grade bulk sacks / drums</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 0', fontWeight: 700, color: '#0d2e1a' }}>Origin</td>
                  <td style={{ padding: '8px 0' }}>Nigeria</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'reviews' && (
            <div>
              <p style={{ fontWeight: 700, color: '#0d2e1a', margin: '0 0 10px' }}>Average Rating: {reviewsAvg.toFixed(1)} / 5.0</p>
              <p style={{ margin: 0, color: '#64748b' }}>Reviews are imported directly from verified export purchase bills.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 1024px) {
          .product-details-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>

    </div>
  )
}
