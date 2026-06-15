import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Icon-button with tooltip (similar to AdminUsers.jsx)
const IconBtn = ({ onClick, title, color = '#4f566b', bg = '#f1f5f9', hoverBg = '#e2e8f0', children }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={title}
        style={{
          background: hovered ? hoverBg : bg, color, border: 'none', borderRadius: 6,
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s ease', flexShrink: 0
        }}
      >
        {children}
      </button>
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#0f172a', color: '#fff', fontSize: 11, fontWeight: 600,
          padding: '4px 8px', borderRadius: 4, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 999
        }}>
          {title}
          <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid #0f172a' }} />
        </div>
      )}
    </div>
  )
}

// Beautiful Confirm Modal
const ConfirmModal = ({ isOpen, title, message, confirmLabel, cancelLabel = 'Cancel', onConfirm, onCancel, variant = 'danger' }) => {
  if (!isOpen) return null
  const colors = {
    danger: { btn: '#dc2626', btnHover: '#b91c1c', icon: '#dc2626', iconBg: '#fef2f2' },
    success: { btn: '#059669', btnHover: '#047857', icon: '#059669', iconBg: '#f0fdf4' },
    warning: { btn: '#d97706', btnHover: '#b45309', icon: '#d97706', iconBg: '#fffbeb' }
  }
  const c = colors[variant] || colors.warning
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: '32px 28px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {variant === 'danger'
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c.icon} strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>{title}</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.6 }}>{message}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 8 }}>
            <button onClick={onCancel} style={{ flex: 1, padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, color: '#475569', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{cancelLabel}</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '10px', background: c.btn, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{confirmLabel}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'approved' | 'hidden'
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Custom modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: '', variant: 'warning', onConfirm: null })
  const showConfirm = (opts) => setConfirmModal({ isOpen: true, ...opts })
  const hideConfirm = () => setConfirmModal(m => ({ ...m, isOpen: false }))

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadReviews = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, email, avatar_url), courses(products(title))')
        .order('created_at', { ascending: false })

      if (data) {
        setReviews(data)
      }
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleToggleApprove = async (review) => {
    const nextStatus = !review.is_approved ? 'Approved' : 'Hidden'
    showConfirm({
      title: `${review.is_approved ? 'Hide' : 'Approve'} Review`,
      message: `Are you sure you want to change this review's visibility status to ${nextStatus}?`,
      confirmLabel: `Yes, Set to ${nextStatus}`,
      variant: 'warning',
      onConfirm: async () => {
        hideConfirm()
        try {
          const { error } = await supabase
            .from('reviews')
            .update({ is_approved: !review.is_approved })
            .eq('id', review.id)

          if (error) throw error
          loadReviews()
          
          if (selectedReview && selectedReview.id === review.id) {
            setSelectedReview({ ...selectedReview, is_approved: !review.is_approved })
          }
        } catch (err) {
          console.error(err.message)
        }
      }
    })
  }

  const handleDeleteReview = async (id) => {
    showConfirm({
      title: 'Delete Review',
      message: 'Are you sure you want to permanently delete this rating and testimonial? This action is irreversible.',
      confirmLabel: 'Yes, Delete Review',
      variant: 'danger',
      onConfirm: async () => {
        hideConfirm()
        try {
          const { error } = await supabase.from('reviews').delete().eq('id', id)
          if (error) throw error
          setSelectedReview(null)
          loadReviews()
        } catch (err) {
          console.error(err.message)
        }
      }
    })
  }

  const filteredReviews = reviews.filter(r => {
    const s = search.toLowerCase()
    const matchesSearch = (r.profiles?.full_name || '').toLowerCase().includes(s) || 
                          (r.profiles?.email || '').toLowerCase().includes(s) ||
                          (r.courses?.products?.title || '').toLowerCase().includes(s) ||
                          (r.review_text || '').toLowerCase().includes(s)
    
    if (!matchesSearch) return false
    if (activeTab === 'approved') return r.is_approved === true
    if (activeTab === 'hidden') return r.is_approved === false
    return true
  })

  const isMobile = windowWidth < 992

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '80vh', position: 'relative' }}>
      <ConfirmModal {...confirmModal} onCancel={hideConfirm} />
      
      {/* Top Section */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Review Moderation</h2>
        <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Approve, hide, or delete ratings and testimonials submitted by course participants.</p>
      </div>

      {/* Grid containing list and details */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedReview && !isMobile ? '1fr 450px' : '1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Side: Reviews List and Filters */}
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Tabs & Search */}
          <div style={{ padding: 16, borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', background: '#f7f8f9', padding: 3, borderRadius: 6, gap: 4 }}>
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 'approved', label: 'Approved' },
                { id: 'hidden', label: 'Hidden' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: activeTab === tab.id ? '#fff' : 'none',
                    border: 'none',
                    color: activeTab === tab.id ? '#2563eb' : '#4f566b',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <input 
              type="text" 
              placeholder="Search reviewer, course or feedback..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, width: '100%', maxWidth: 280 }}
            />
          </div>

          {/* Table */}
          <div className="admin-table-container">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Reviewer</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Course</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Rating</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Visibility</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: '#697386', fontSize: 13 }}>Loading reviews...</td></tr>
                ) : filteredReviews.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: '#697386', fontSize: 13 }}>No reviews match the filters.</td></tr>
                ) : (
                  filteredReviews.map(r => (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedReview(r)}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9', 
                        cursor: 'pointer',
                        background: selectedReview?.id === r.id ? '#f8fafc' : 'none',
                        transition: 'background 0.1s'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            background: '#e2e8f0', 
                            backgroundImage: r.profiles?.avatar_url ? `url(${r.profiles?.avatar_url})` : 'none', 
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: '#475569',
                            fontSize: 12
                          }}>
                            {!r.profiles?.avatar_url && (r.profiles?.full_name || r.profiles?.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1a1f36', fontSize: 13 }}>{r.profiles?.full_name || 'Student'}</div>
                            <div style={{ color: '#697386', fontSize: 12 }}>{r.profiles?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#4f566b', fontSize: 13, fontWeight: 500 }}>
                        {r.courses?.products?.title || 'Unknown Course'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f59e0b', fontSize: 13.5 }}>
                        {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          fontSize: 10.5, 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          padding: '3px 8px', 
                          borderRadius: 12, 
                          background: r.is_approved ? '#e3fcef' : '#ffebe6', 
                          color: r.is_approved ? '#00875a' : '#ae2a19'
                        }}>
                          {r.is_approved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedReview(r) }}
                          style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Sliding Detail Drawer (Desktop) or Modal (Mobile) */}
        {selectedReview && (
          <div style={isMobile ? {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', 
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
          } : {
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)'
          }}>
            <div style={isMobile ? {
              background: '#fff', padding: 28, borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 24
            } : { display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: '50%', 
                    background: '#e2e8f0', 
                    backgroundImage: selectedReview.profiles?.avatar_url ? `url(${selectedReview.profiles?.avatar_url})` : 'none', 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    fontSize: 16
                  }}>
                    {!selectedReview.profiles?.avatar_url && (selectedReview.profiles?.full_name || selectedReview.profiles?.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1f36', margin: 0 }}>{selectedReview.profiles?.full_name || 'Student Reviewer'}</h3>
                    <span style={{ fontSize: 12.5, color: '#697386' }}>{selectedReview.profiles?.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReview(null)}
                  style={{ background: 'none', border: 'none', color: '#697386', fontSize: 18, cursor: 'pointer', padding: 4 }}
                >
                  &times;
                </button>
              </div>

              {/* Review Details Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Course Reviewed</h4>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{selectedReview.courses?.products?.title || 'Unknown Course'}</div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Rating Given</h4>
                  <div style={{ fontSize: 18, color: '#f59e0b', fontWeight: 600 }}>
                    {'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}
                    <span style={{ fontSize: 13.5, color: '#475569', marginLeft: 8, fontWeight: 500 }}>({selectedReview.rating} out of 5 stars)</span>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>Feedback Comment</h4>
                  <div style={{ 
                    padding: 16, 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: 8, 
                    fontSize: 13.5, 
                    color: '#334155', 
                    lineHeight: 1.6,
                    fontStyle: selectedReview.review_text ? 'normal' : 'italic'
                  }}>
                    {selectedReview.review_text || 'No comment text submitted.'}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Date Submitted</h4>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    {new Date(selectedReview.created_at).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                </div>
              </div>

              {/* Administrative Toolkit Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 12 }}>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Visibility & Moderation Toolkit</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button 
                    onClick={() => handleToggleApprove(selectedReview)}
                    style={{ 
                      background: selectedReview.is_approved ? '#dc2626' : '#059669', 
                      color: '#fff', 
                      border: 'none',
                      padding: '10px 12px', 
                      borderRadius: 6, 
                      fontWeight: 600, 
                      fontSize: 13, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: 8, 
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {selectedReview.is_approved ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        Hide Review
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        Approve Review
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleDeleteReview(selectedReview.id)}
                    style={{ 
                      background: '#fff', 
                      border: '1px solid #cbd5e1', 
                      color: '#dc2626', 
                      padding: '10px 12px', 
                      borderRadius: 6, 
                      fontWeight: 600, 
                      fontSize: 13, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Delete Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
