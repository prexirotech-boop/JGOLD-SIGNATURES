import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  
  // Persistent Search State
  const [search, setSearch] = useState(() => {
    return localStorage.getItem('blog_search_query') || ''
  })
  
  // Persistent Category State
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('blog_active_category') || 'All'
  })

  useEffect(() => {
    localStorage.setItem('blog_search_query', search)
  }, [search])

  useEffect(() => {
    localStorage.setItem('blog_active_category', activeCategory)
  }, [activeCategory])

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          setPosts(data)
        }
      } catch (err) {
        console.error('Error fetching blog posts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const categories = ['All', 'Strategy', 'Onboarding', 'Marketing', 'Mindset']

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      (post.summary || '').toLowerCase().includes(search.toLowerCase()) ||
      post.content.toLowerCase().includes(search.toLowerCase())
    
    // In our DB, we can match category from summaries/tags or just group them dynamically
    const categoryLower = activeCategory.toLowerCase()
    const matchesCategory = 
      activeCategory === 'All' || 
      (post.summary || '').toLowerCase().includes(categoryLower) ||
      post.title.toLowerCase().includes(categoryLower)
    
    return matchesSearch && matchesCategory
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#334155', fontFamily: "'Outfit', 'Inter', sans-serif", padding: '80px 20px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ 
            background: 'rgba(37, 99, 235, 0.06)', 
            color: '#2563eb', 
            padding: '6px 16px', 
            borderRadius: 50, 
            fontSize: 12, 
            fontWeight: 700, 
            letterSpacing: '1px', 
            textTransform: 'uppercase', 
            display: 'inline-block',
            marginBottom: 20,
            border: '1px solid rgba(37, 99, 235, 0.15)'
          }}>
            Resource Hub & Tutorials
          </span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 850, letterSpacing: '-1.5px', color: '#0f172a', margin: '0 0 16px', lineHeight: 1.15 }}>
            Amplified Skills <span style={{ color: '#2563eb' }}>Blueprint Blog</span>
          </h1>
          <p style={{ fontSize: 17, color: '#64748b', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Premium articles, student onboarding guides, and business blueprints compiled by Precious.
          </p>

          {/* Search and Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text"
                placeholder="Search articles and blueprints..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '16px 20px 16px 52px',
                  fontSize: 15,
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#2563eb'
                  e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#64748b" 
                strokeWidth="2.5" 
                width="18"
                height="18"
                style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Categories */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? '#2563eb' : '#ffffff',
                    border: activeCategory === cat ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    padding: '8px 18px',
                    borderRadius: 50,
                    fontSize: 13,
                    fontWeight: 600,
                    color: activeCategory === cat ? '#ffffff' : '#64748b',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                  }}
                  onMouseEnter={e => {
                    if (activeCategory !== cat) {
                      e.target.style.borderColor = '#cbd5e1'
                      e.target.style.color = '#0f172a'
                    }
                  }}
                  onMouseLeave={e => {
                    if (activeCategory !== cat) {
                      e.target.style.borderColor = '#e2e8f0'
                      e.target.style.color = '#64748b'
                    }
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(0,0,0,0.05)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            Loading resources...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: 40, display: 'block', marginBottom: 16 }}>📖</span>
            <h3 style={{ fontSize: 20, color: '#0f172a', marginBottom: 8, fontWeight: 700 }}>No articles found</h3>
            <p style={{ color: '#64748b' }}>Try adjusting your filters or search terms. New blueprints are published regularly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
            {filteredPosts.map(post => (
              <div 
                key={post.id} 
                className="blog-card"
                onClick={() => setSelectedPost(post)}
                style={{ 
                  background: '#ffffff', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: 16, 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.02)'
                }}
              >
                <div style={{ height: 180, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
                  {post.cover_image ? (
                    <img 
                      src={post.cover_image} 
                      alt={post.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                      className="blog-card-img"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', fontWeight: 800, fontSize: 32 }}>
                      AS
                    </div>
                  )}
                  <span style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px solid rgba(37, 99, 235, 0.15)',
                    color: '#2563eb',
                    padding: '4px 10px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    Blueprint
                  </span>
                </div>
                
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                    <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>&bull;</span>
                    <span>5 min read</span>
                  </div>
                  <h3 style={{ fontSize: 18, color: '#0f172a', fontWeight: 800, margin: '0 0 10px', lineHeight: 1.4, transition: 'color 0.2s' }} className="blog-title">
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.summary || 'No summary available. Click to open and read full article contents.'}
                  </p>
                  
                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#2563eb', fontSize: 13.5, fontWeight: 700 }}>
                    Read Blueprint
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Post Reader Modal */}
        {selectedPost && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0',
              borderRadius: 20, 
              width: '100%', 
              maxWidth: 760, 
              maxHeight: '85vh', 
              overflowY: 'auto', 
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              
              {/* Cover Banner */}
              <div style={{ height: 260, position: 'relative', background: '#f1f5f9', flexShrink: 0 }}>
                {selectedPost.cover_image ? (
                  <img src={selectedPost.cover_image} alt={selectedPost.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', fontWeight: 800, fontSize: 48 }}>
                    AS
                  </div>
                )}
                
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedPost(null)}
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#0f172a',
                    transition: 'background 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '36px 40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                  <span>Instructor Precious</span>
                  <span>&bull;</span>
                  <span>{new Date(selectedPost.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                
                <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: '#0f172a', margin: '0 0 20px', lineHeight: 1.25, letterSpacing: '-0.8px' }}>
                  {selectedPost.title}
                </h2>
                
                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, fontStyle: 'italic', paddingLeft: 16, borderLeft: '3px solid #2563eb', margin: '0 0 32px' }}>
                  {selectedPost.summary}
                </p>

                <div style={{ 
                  fontSize: 15.5, 
                  color: '#334155', 
                  lineHeight: 1.8, 
                  whiteSpace: 'pre-wrap', 
                  margin: 0 
                }}>
                  {selectedPost.content}
                </div>
              </div>
              
              {/* Footer */}
              <div style={{ padding: '20px 40px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <button 
                  onClick={() => setSelectedPost(null)}
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13.5,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#e2e8f0'
                    e.currentTarget.style.color = '#0f172a'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.color = '#475569'
                  }}
                >
                  Close Reader
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Global Styles for Hover Effects */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
          .blog-card:hover {
            transform: translateY(-6px);
            border-color: rgba(37, 99, 235, 0.3) !important;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08), 0 0 15px rgba(37, 99, 235, 0.04) !important;
            background: #ffffff !important;
          }
          .blog-card:hover .blog-card-img {
            transform: scale(1.05);
          }
          .blog-card:hover .blog-title {
            color: #2563eb !important;
          }
        `}} />

      </div>
    </div>
  )
}
