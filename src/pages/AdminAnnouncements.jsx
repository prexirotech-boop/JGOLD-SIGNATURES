import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('draft_announcement_form')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {}
    }
    return { title: '', body: '', course_id: '' }
  })

  useEffect(() => {
    localStorage.setItem('draft_announcement_form', JSON.stringify(form))
  }, [form])

  const loadData = async () => {
    setLoading(true)
    const { data: ann } = await supabase
      .from('announcements')
      .select('*, courses(products(title))')
      .order('created_at', { ascending: false })
    if (ann) setAnnouncements(ann)

    const { data: crs } = await supabase
      .from('courses')
      .select('id, products(title)')
    if (crs) setCourses(crs)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: form.title.trim(),
          body: form.body.trim(),
          course_id: form.course_id || null
        })

      if (error) throw error
      setShowAddModal(false)
      localStorage.removeItem('draft_announcement_form')
      setForm({ title: '', body: '', course_id: '' })
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this broadcast announcement?')) return
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Announcements & Broadcasts</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Broadcast platform updates or curriculum announcements directly to your students.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.08)' }}
        >
          + Send Broadcast
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#697386', fontSize: 13 }}>Loading announcements...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {announcements.length === 0 ? (
            <div style={{ padding: 32, background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, textAlign: 'center', color: '#697386', fontSize: 13 }}>
              No broadcast announcements recorded yet.
            </div>
          ) : (
            announcements.map(a => (
              <div key={a.id} style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1a1f36' }}>{a.title}</h4>
                    <span style={{ fontSize: 11, color: '#697386', marginTop: 4, display: 'inline-block' }}>
                      Sent {new Date(a.created_at).toLocaleString()} &bull; Target: {a.courses?.products?.title || 'All Students'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(a.id)}
                    style={{ background: 'none', border: 'none', color: '#ae2a19', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 13.5, color: '#4f566b', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.body}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1f36' }}>Draft Announcement</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Select Target Course</label>
                <select 
                  value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value })}
                  style={{ 
                    width: '100%', 
                    padding: '8px 36px 8px 12px', 
                    borderRadius: 4, 
                    border: '1px solid #cbd5e1', 
                    fontSize: 13, 
                    background: '#fff',
                    appearance: 'none',
                    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%23697386' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>\")",
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="">All Registered Students</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.products?.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Title / Subject *</label>
                <input 
                  type="text" 
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                  placeholder="e.g. New Live QA Session scheduled for tomorrow"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Announcement Body *</label>
                <textarea 
                  value={form.body} 
                  onChange={e => setForm({ ...form, body: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 120 }} 
                  required 
                  placeholder="Write your email/broadcast content here..."
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13 }}>
                  {submitting ? 'Broadcasting...' : 'Send Broadcast'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
