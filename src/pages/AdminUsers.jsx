import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Icon-button with tooltip
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
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
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

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const roleParam = searchParams.get('role')

  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const activeTab = roleParam === 'admin' ? 'staff' : (roleParam === 'user' ? 'students' : 'all')
  const setActiveTab = (tabId) => {
    const role = tabId === 'staff' ? 'admin' : (tabId === 'students' ? 'user' : 'all')
    if (role === 'all') {
      searchParams.delete('role')
    } else {
      searchParams.set('role', role)
    }
    setSearchParams(searchParams)
  }

  const [selectedUser, setSelectedUser] = useState(null)
  const [userEnrollments, setUserEnrollments] = useState([])
  const [userOrders, setUserOrders] = useState([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  
  // Grant enrollment input state
  const [courseToEnroll, setCourseToEnroll] = useState('')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Add staff input state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')

  // Custom modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: '', variant: 'warning', onConfirm: null })
  const showConfirm = (opts) => setConfirmModal({ isOpen: true, ...opts })
  const hideConfirm = () => setConfirmModal(m => ({ ...m, isOpen: false }))

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // 1. Get profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, created_at')
        .order('created_at', { ascending: false })

      if (pErr) throw pErr

      // 2. Get enrollment counts (safely handle missing or empty enrollments table)
      const { data: enrolls } = await supabase
        .from('enrollments')
        .select('id, user_id')

      const enrollCountMap = {}
      if (enrolls) {
        enrolls.forEach(e => {
          enrollCountMap[e.user_id] = (enrollCountMap[e.user_id] || 0) + 1
        })
      }

      if (profiles) {
        setUsers(profiles.map(u => ({
          ...u,
          enrollmentCount: enrollCountMap[u.id] || 0
        })))
      }
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCoursesAndLessons = async () => {
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, products(title)')
      if (coursesData) setCourses(coursesData)

      // Fetch lessons to calculate progress
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('id, module_id, modules(course_id)')
      if (lessonsData) setLessons(lessonsData)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadUsers()
    loadCoursesAndLessons()
  }, [])

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin'
    showConfirm({
      title: 'Change User Role',
      message: `Are you sure you want to change this user's role to ${nextRole}?`,
      confirmLabel: 'Yes, Change Role',
      variant: 'warning',
      onConfirm: async () => {
        hideConfirm()
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ role: nextRole })
            .eq('id', userId)

          if (error) throw error
          loadUsers()
          if (selectedUser && selectedUser.id === userId) {
            setSelectedUser({ ...selectedUser, role: nextRole })
          }
        } catch (err) {
          console.error(err.message)
        }
      }
    })
  }

  const handleCreateStaff = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      // Check if user already has a profile
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim())
        .maybeSingle()

      if (existingUser) {
        // Upgrade existing user to admin
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'admin', full_name: inviteName.trim() || inviteEmail.split('@')[0] })
          .eq('id', existingUser.id)
        if (error) throw error
      } else {
        // Insert a new placeholder profile (auth signup will link to it upon registering)
        const { error } = await supabase
          .from('profiles')
          .insert({
            email: inviteEmail.trim(),
            full_name: inviteName.trim() || inviteEmail.split('@')[0],
            role: 'admin'
          })
        if (error) throw error
      }

      setInviteEmail('')
      setInviteName('')
      setShowAddStaffModal(false)
      loadUsers()
    } catch (err) {
      console.error(err.message)
    }
  }

  const handleViewEnrollments = async (user) => {
    setSelectedUser(user)
    setLoadingEnrollments(true)

    try {
      // 1. Load active enrollments
      const { data: enrData, error: eErr } = await supabase
        .from('enrollments')
        .select(`
          id,
          course_id,
          created_at,
          progress,
          courses (
            products (
              title
            )
          )
        `)
        .eq('user_id', user.id)

      if (eErr) throw eErr
      setUserEnrollments(enrData || [])

      // 2. Load user's transaction logs
      const { data: ordData, error: oErr } = await supabase
        .from('orders')
        .select(`
          id,
          reference,
          amount,
          status,
          created_at,
          products ( title )
        `)
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })

      if (oErr) throw oErr
      setUserOrders(ordData || [])

    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEnrollments(false)
    }
  }

  const handleEnrollUser = async (e) => {
    e.preventDefault()
    if (!courseToEnroll || !selectedUser) return

    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          user_id: selectedUser.id,
          course_id: courseToEnroll,
          progress: []
        })

      if (error) throw error

      setCourseToEnroll('')
      handleViewEnrollments(selectedUser)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUnenrollUser = async (enrollmentId) => {
    showConfirm({
      title: 'Revoke Course Access',
      message: 'Are you sure you want to unenroll this student? Dynamic progress stats will be permanently wiped.',
      confirmLabel: 'Yes, Revoke Access',
      variant: 'danger',
      onConfirm: async () => {
        hideConfirm()
        try {
          const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('id', enrollmentId)

          if (error) throw error
          handleViewEnrollments(selectedUser)
          loadUsers()
        } catch (err) {
          console.error(err.message)
        }
      }
    })
  }

  // Support Impersonation Logic
  const handleImpersonate = (student) => {
    showConfirm({
      title: 'Launch POV Support Mode',
      message: `You are about to view the student portal from ${student.full_name || student.email}'s perspective. Proceed?`,
      confirmLabel: 'Yes, Launch POV Mode',
      variant: 'warning',
      onConfirm: () => {
        hideConfirm()
        localStorage.setItem('impersonatedUser', JSON.stringify({
          id: student.id,
          email: student.email,
          full_name: student.full_name || student.email.split('@')[0]
        }))
        window.location.href = '/dashboard'
      }
    })
  }

  // Calculate course lessons count and progress percentages
  const getCourseProgressDetails = (courseId, progressArray = []) => {
    const courseLessons = lessons.filter(l => l.modules?.course_id === courseId)
    const total = courseLessons.length || 1
    const completed = progressArray.filter(pId => courseLessons.some(l => l.id === pId)).length
    const percent = Math.min(100, Math.round((completed / total) * 100))
    return {
      completed,
      total,
      percent
    }
  }

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase()
    const matchesSearch = (u.email || '').toLowerCase().includes(s) || 
                          (u.full_name || '').toLowerCase().includes(s)
    
    if (!matchesSearch) return false
    if (activeTab === 'staff') return u.role === 'admin'
    if (activeTab === 'students') return u.role !== 'admin'
    return true
  })

  const isMobile = windowWidth < 992

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minHeight: '80vh', position: 'relative' }}>
      <ConfirmModal {...confirmModal} onCancel={hideConfirm} />
      
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Staff & Customer Accounts</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Manage administrators, support student inquiries, grant custom curriculum access, and run impersonation previews.</p>
        </div>
        <button 
          onClick={() => setShowAddStaffModal(true)}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 4, fontWeight: 500, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s ease' }}
        >
          + Add Staff Member
        </button>
      </div>

      {/* Grid containing Sidebar list and Drawer details */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedUser && !isMobile ? '1fr 450px' : '1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Side: Users List and Filters */}
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          {/* Tabs & Search */}
          <div style={{ padding: 16, borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', background: '#f7f8f9', padding: 3, borderRadius: 6, gap: 4 }}>
              {[
                { id: 'all', label: 'All Accounts' },
                { id: 'students', label: 'Students' },
                { id: 'staff', label: 'Internal Staff' }
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
              placeholder="Search by name or email address..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, width: '100%', maxWidth: 280 }}
            />
          </div>

          {/* Users Table */}
          <div className="admin-table-container">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8f9', borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>User Profile</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Permissions</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Enrollments</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Joined Date</th>
                  <th style={{ padding: '12px 16px', color: '#4f566b', fontSize: 11, textTransform: 'uppercase', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: '#697386', fontSize: 13 }}>Loading profile accounts...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: 32, textAlign: 'center', color: '#697386', fontSize: 13 }}>No profiles match the filter.</td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr 
                      key={u.id} 
                      onClick={() => handleViewEnrollments(u)}
                      style={{ 
                        borderBottom: '1px solid #f1f5f9', 
                        cursor: 'pointer',
                        background: selectedUser?.id === u.id ? '#f8fafc' : 'none',
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
                            backgroundImage: u.avatar_url ? `url(${u.avatar_url})` : 'none', 
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: '#475569',
                            fontSize: 12
                          }}>
                            {!u.avatar_url && (u.full_name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1a1f36', fontSize: 13 }}>{u.full_name || 'Anonymous Student'}</div>
                            <div style={{ color: '#697386', fontSize: 12 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          fontSize: 10.5, 
                          fontWeight: 700, 
                          textTransform: 'uppercase', 
                          padding: '3px 8px', 
                          borderRadius: 12, 
                          background: u.role === 'admin' ? '#e0f2fe' : '#f1f5f9', 
                          color: u.role === 'admin' ? '#0369a1' : '#475569' 
                        }}>
                          {u.role === 'admin' ? 'Staff' : 'Student'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#1a1f36', fontSize: 13, fontWeight: 500 }}>
                        {u.enrollmentCount} Course{u.enrollmentCount !== 1 && 's'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#697386', fontSize: 12.5 }}>
                        {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleViewEnrollments(u) }}
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
        {selectedUser && (
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
                    backgroundImage: selectedUser.avatar_url ? `url(${selectedUser.avatar_url})` : 'none', 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 600,
                    color: '#475569',
                    fontSize: 16
                  }}>
                    {!selectedUser.avatar_url && (selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1f36', margin: 0 }}>{selectedUser.full_name || 'Customer Profile'}</h3>
                    <span style={{ fontSize: 12.5, color: '#697386' }}>{selectedUser.email}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  style={{ background: 'none', border: 'none', color: '#697386', fontSize: 18, cursor: 'pointer', padding: 4 }}
                >
                  &times;
                </button>
              </div>

              {/* Impersonate & Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Administrative Toolkit</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button 
                    onClick={() => handleImpersonate(selectedUser)}
                    style={{ 
                      background: '#fff', border: '1px solid #cbd5e1', color: '#0f172a', 
                      padding: '10px 12px', borderRadius: 6, fontWeight: 600, fontSize: 13, 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.15s ease'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Impersonate User
                  </button>
                  <button 
                    onClick={() => handleToggleRole(selectedUser.id, selectedUser.role)}
                    style={{ 
                      background: '#fff', 
                      border: '1px solid #cbd5e1', 
                      color: '#475569', 
                      padding: '10px 12px', 
                      borderRadius: 6, 
                      fontWeight: 600, 
                      fontSize: 13, 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Set to {selectedUser.role === 'admin' ? 'Student' : 'Staff'}
                  </button>
                </div>
              </div>

              {/* Course Access Grantor */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Grant Direct Access</h4>
                <form onSubmit={handleEnrollUser} style={{ display: 'flex', gap: 8 }}>
                  <select 
                    value={courseToEnroll}
                    onChange={e => setCourseToEnroll(e.target.value)}
                    style={{ flex: 1, padding: '7px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                    required
                  >
                    <option value="">Choose course to enroll...</option>
                    {courses
                      .filter(c => !userEnrollments.some(e => e.course_id === c.id))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.products?.title}</option>
                      ))
                    }
                  </select>
                  <button 
                    type="submit" 
                    style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 4, fontWeight: 500, fontSize: 12.5, cursor: 'pointer' }}
                  >
                    Grant
                  </button>
                </form>
              </div>

              {/* Enrolled Courses list with dynamic percentage bars */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>Active Access List</h4>
                
                {loadingEnrollments ? (
                  <div style={{ color: '#697386', fontSize: 12 }}>Loading curriculum logs...</div>
                ) : userEnrollments.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#697386', fontStyle: 'italic' }}>No courses currently associated with this profile.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userEnrollments.map(e => {
                      const details = getCourseProgressDetails(e.course_id, e.progress)
                      return (
                        <div key={e.id} style={{ padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{e.courses?.products?.title}</div>
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Enrolled on {new Date(e.created_at).toLocaleDateString()}</div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleUnenrollUser(e.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, fontSize: 11.5, cursor: 'pointer' }}
                            >
                              Revoke
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div style={{ marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 4 }}>
                              <span>Progress Rate</span>
                              <span>{details.percent}% ({details.completed}/{details.total} lessons)</span>
                            </div>
                            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: '#10b981', width: `${details.percent}%`, borderRadius: 3 }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Transactions list */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>E-Commerce Orders</h4>
                
                {loadingEnrollments ? (
                  <div style={{ color: '#697386', fontSize: 12 }}>Loading payments...</div>
                ) : userOrders.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#697386', fontStyle: 'italic' }}>No billing orders match this customer's email.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }} className="no-scrollbar">
                    {userOrders.map(o => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12.5 }}>
                        <div>
                        <div style={{ fontWeight: 600, color: '#1a1f36' }}>{o.products?.title || 'E-Learning Course'}</div>
                          <span style={{ fontSize: 11, color: '#697386', fontFamily: 'monospace' }}>{o.reference}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: '#1a1f36' }}>₦{o.amount.toLocaleString()}</div>
                          <span style={{ fontSize: 9.5, color: o.status === 'paid' ? '#10b981' : '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Invite/Add Staff Member */}
      {showAddStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Register Internal Staff</h3>
            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#344054' }}>Full Name</label>
                <input 
                  type="text" 
                  value={inviteName} 
                  onChange={e => setInviteName(e.target.value)} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #d0d5dd', fontSize: 14, outline: 'none', transition: 'border-color 0.15s ease-in-out' }} 
                  placeholder="e.g. Samuel Adewale"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#344054' }}>Email Address *</label>
                <input 
                  type="email" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #d0d5dd', fontSize: 14, outline: 'none', transition: 'border-color 0.15s ease-in-out' }} 
                  required 
                  placeholder="staff@amplifiedskills.com"
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13.5, transition: 'all 0.15s' }}>Promote to Staff</button>
                <button type="button" onClick={() => setShowAddStaffModal(false)} style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13.5, transition: 'all 0.15s' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
