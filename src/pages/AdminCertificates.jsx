import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const generateCertNumber = () => {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substr(2, 5).toUpperCase()
  return `AS-${ts}-${rand}`
}

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [revokeLoading, setRevokeLoading] = useState(null)

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const isMobile = windowWidth < 768

  const [issueForm, setIssueForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('draft_certIssue') || '{}') } catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem('draft_certIssue', JSON.stringify(issueForm))
  }, [issueForm])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Fetch certificates with wildcard to prevent 400 Bad Request if columns are missing
      const { data: certs, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .order('issued_at', { ascending: false })

      if (certError) throw certError

      // Get unique user and course IDs
      const userIds = Array.from(new Set((certs || []).map(c => c.user_id).filter(Boolean)))
      const courseIds = Array.from(new Set((certs || []).map(c => c.course_id).filter(Boolean)))

      // 2. Fetch profiles, products, courses in parallel
      const [profilesRes, productsRes] = await Promise.all([
        userIds.length > 0 ? supabase.from('profiles').select('id, full_name, email').in('id', userIds) : { data: [] },
        courseIds.length > 0 ? supabase.from('products').select('id, title').in('id', courseIds) : { data: [] }
      ])

      const profilesMap = {}
      ;(profilesRes.data || []).forEach(p => { profilesMap[p.id] = p })

      const productsMap = {}
      ;(productsRes.data || []).forEach(p => { productsMap[p.id] = p })

      // 3. Assemble certificates list matching the expected structure with client-side fallbacks
      const assembled = (certs || []).map(c => {
        const profile = profilesMap[c.user_id] || { full_name: '—', email: '' }
        const product = productsMap[c.course_id] || { title: 'Accredited Certification' }
        
        // Generate a fallback certificate number based on issued_at and ID suffix
        const certNumber = c.certificate_number || `AS-${new Date(c.issued_at || Date.now()).getTime().toString(36).toUpperCase()}-${String(c.id || '').slice(-5).toUpperCase()}`
        const isValid = c.is_valid !== undefined && c.is_valid !== null ? c.is_valid : true

        return {
          ...c,
          certificate_number: certNumber,
          is_valid: isValid,
          profiles: profile,
          courses: {
            id: c.course_id,
            products: product
          }
        }
      })

      // 4. Assemble courses list for the dropdown select in the Issue modal
      const { data: allCourses } = await supabase.from('courses').select('id')
      const { data: allProducts } = await supabase.from('products').select('id, title')
      
      const allProductsMap = {}
      ;(allProducts || []).forEach(p => { allProductsMap[p.id] = p })
      
      const assembledCourses = (allCourses || []).map(c => ({
        id: c.id,
        products: allProductsMap[c.id] || { title: 'Untitled Course' }
      }))

      setCertificates(assembled)
      setCourses(assembledCourses)
    } catch (err) {
      console.error('Error fetching certificates data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleIssue = async (e) => {
    e.preventDefault()
    if (!issueForm.user_email?.trim() || !issueForm.course_id) return
    setSubmitting(true)
    try {
      const { data: userProfile, error: uErr } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('email', issueForm.user_email.trim())
        .single()

      if (uErr || !userProfile) throw new Error('No user found with that email address.')

      let insertData = { 
        user_id: userProfile.id, 
        course_id: issueForm.course_id, 
        certificate_number: generateCertNumber(), 
        is_valid: true 
      }
      let { error } = await supabase.from('certificates').insert(insertData)

      // Retry without certificate_number and is_valid if columns do not exist (error code 42703)
      if (error && error.code === '42703') {
        const fallbackInsertData = {
          user_id: userProfile.id,
          course_id: issueForm.course_id
        }
        const { error: fallbackErr } = await supabase.from('certificates').insert(fallbackInsertData)
        error = fallbackErr
      }

      if (error) {
        if (error.code === '23505') throw new Error('This student already has a certificate for this course.')
        throw error
      }

      localStorage.removeItem('draft_certIssue')
      setIssueForm({})
      setShowIssueModal(false)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleRevoke = async (certId, currentlyValid) => {
    if (!confirm(currentlyValid ? 'Revoke this certificate? The student will lose access.' : 'Restore this certificate?')) return
    setRevokeLoading(certId)
    const { error } = await supabase.from('certificates').update({ is_valid: !currentlyValid }).eq('id', certId)
    if (error) {
      console.error('Error updating certificate validity:', error)
      alert('Failed to update certificate status. Your database table is missing the "is_valid" column. Please run the SQL migrations in your Supabase dashboard.')
    }
    setRevokeLoading(null)
    loadData()
  }

  const filtered = certificates.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.profiles?.full_name?.toLowerCase().includes(q) ||
      c.profiles?.email?.toLowerCase().includes(q) ||
      c.courses?.products?.title?.toLowerCase().includes(q) ||
      c.certificate_number?.toLowerCase().includes(q)
    )
  })

  const totalIssued = certificates.length
  const totalActive = certificates.filter(c => c.is_valid).length
  const totalRevoked = certificates.filter(c => !c.is_valid).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'var(--font)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', margin: 0 }}>Certificates</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 13.5, margin: '4px 0 0' }}>
            Auto-issued on course completion. Manually issue or revoke from here.
          </p>
        </div>
        <button
          onClick={() => setShowIssueModal(true)}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Issue Certificate
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 16 }}>
        {[
          { label: 'Total Issued', value: totalIssued, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Active', value: totalActive, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>, color: '#00875a', bg: 'rgba(0,135,90,0.08)' },
          { label: 'Revoked', value: totalRevoked, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>, color: '#ae2a19', bg: 'rgba(174,42,25,0.08)' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, padding: isMobile ? '12px 10px' : '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, marginBottom: isMobile ? 4 : 10 }}>
              <div style={{ width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {isMobile ? <span style={{ transform: 'scale(0.8)', display: 'flex' }}>{s.icon}</span> : s.icon}
              </div>
              <span style={{ fontSize: isMobile ? 9 : 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <input
              type="text"
              placeholder="Search student, course, certificate #..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }}
            />
          </div>
          <span style={{ fontSize: 12, color: '#697386', whiteSpace: 'nowrap' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#697386', fontSize: 13 }}>Loading certificates...</div>
          ) : (
            <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '25%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e3e8ee' }}>
                  {['Student', 'Course', 'Certificate #', 'Issued', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#697386', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#697386', fontSize: 13 }}>
                    No certificates found. {certificates.length === 0 ? 'Issue certificates manually or they auto-issue on completion.' : ''}
                  </td></tr>
                ) : (
                  filtered.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f7f8f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1f36', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.profiles?.full_name || '—'}</div>
                        <div style={{ fontSize: 11, color: '#697386', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.profiles?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#3c4257', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.courses?.products?.title || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: '#4f566b', whiteSpace: 'nowrap' }}>
                        {c.certificate_number}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#697386', whiteSpace: 'nowrap' }}>
                        {new Date(c.issued_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: c.is_valid ? '#e3fcef' : '#fff0f0',
                          color: c.is_valid ? '#00875a' : '#ae2a19'
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                          {c.is_valid ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleRevoke(c.id, c.is_valid)}
                          disabled={revokeLoading === c.id}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
                            borderRadius: 4, fontSize: 11.5, fontWeight: 500,
                            color: c.is_valid ? '#ae2a19' : '#00875a',
                            opacity: revokeLoading === c.id ? 0.5 : 1
                          }}
                        >
                          {c.is_valid ? 'Revoke' : 'Restore'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Issue Modal */}
      {showIssueModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, padding: '32px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Issue Certificate</h3>
              <p style={{ fontSize: 13, color: '#697386', marginTop: 6 }}>Manually grant a course certificate to a student by their email.</p>
            </div>

            <form onSubmit={handleIssue} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Student Email *</label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={issueForm.user_email || ''}
                  onChange={e => setIssueForm(f => ({ ...f, user_email: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Course *</label>
                <select
                  required
                  value={issueForm.course_id || ''}
                  onChange={e => setIssueForm(f => ({ ...f, course_id: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">Select a course...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.products?.title || 'Untitled'}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Issuing...' : 'Issue Certificate'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: 6, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
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
