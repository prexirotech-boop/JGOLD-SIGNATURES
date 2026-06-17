import { useState, useEffect, useRef } from 'react'
import { Link, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AdminCourses from './AdminCourses'
import AdminCourseBuilder from './AdminCourseBuilder'
import AdminUsers from './AdminUsers'
import AdminOrders from './AdminOrders'
import AdminSettings from './AdminSettings'
import AdminCertificates from './AdminCertificates'
import AdminAnnouncements from './AdminAnnouncements'
import AdminCoupons from './AdminCoupons'
import AdminQnA from './AdminQnA'
import AdminReviews from './AdminReviews'
import AdminPages from './AdminPages'
import AdminAffiliates from './AdminAffiliates'
import AdminPayouts from './AdminPayouts'
import AdminUpsells from './AdminUpsells'

function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, productsCount: 0, conversionRate: 0, courseStats: [], unansweredQna: 0 })
  const [chartData, setChartData] = useState({ revenuePoints: [], orderPoints: [] })
  const [recentPayments, setRecentPayments] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const navigate = useNavigate()

  const [hoveredRevenue, setHoveredRevenue] = useState(null)
  const [hoveredOrder, setHoveredOrder] = useState(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    async function loadStats() {
      try {
          console.log('[AdminStats] Loading stats via client-side parallel queries...')
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

          const [
            resUsersCount,
            resTotalOrders,
            resProdCount,
            resUnansQna,
            resPaidOrdersCount,
            resRevData,
            resRecentOrders,
            resCourses,
            resUsers
          ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('products').select('*', { count: 'exact', head: true }),
            supabase.from('qna_questions').select('*', { count: 'exact', head: true }).eq('is_resolved', false),
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
            supabase.from('orders').select('amount').eq('status', 'paid'),
            supabase.from('orders').select(`
              id,
              reference,
              customer_email,
              customer_name,
              amount,
              status,
              created_at,
              products ( title )
            `).order('created_at', { ascending: false }).limit(5),
            supabase.from('courses').select('id, level, products(title), enrollments(id)'),
            supabase.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5)
          ])

          const usersCount = resUsersCount.count
          const totalOrders = resTotalOrders.count
          const prodCount = resProdCount.count
          const unansQna = resUnansQna.count
          const paidOrdersCount = resPaidOrdersCount.count
          const revData = resRevData.data
          const recentOrders = resRecentOrders.data
          const courses = resCourses.data
          const users = resUsers.data

          const rev = (revData || []).reduce((a, b) => a + (b.amount || 0), 0)
          const rate = totalOrders ? Math.round((paidOrdersCount / totalOrders) * 100) : 0
          const cStats = (courses || []).map(c => ({
            title: c.products?.title || 'Untitled Course',
            level: c.level,
            enrollmentsCount: c.enrollments?.length || 0
          })).sort((a, b) => b.enrollmentsCount - a.enrollmentsCount)

          setStats({ 
            users: usersCount || 0, 
            orders: paidOrdersCount || 0, 
            revenue: rev, 
            productsCount: prodCount || 0,
            conversionRate: rate,
            courseStats: cStats,
            unansweredQna: unansQna || 0
          })

          setRecentPayments(recentOrders || [])
          setRecentUsers(users || [])

        const { data: chartOrders } = await supabase
          .from('orders')
          .select('amount, status, created_at')
          .gte('created_at', sevenDaysAgo.toISOString())

        const last7Days = Array.from({ length: 7 }).map((_, idx) => {
          const date = new Date()
          date.setDate(date.getDate() - idx)
          return date.toISOString().split('T')[0]
        }).reverse()

        const revPoints = last7Days.map(dateStr => {
          const dayAmount = (chartOrders || [])
            .filter(o => o.status === 'paid' && o.created_at.startsWith(dateStr))
            .reduce((sum, o) => sum + (o.amount || 0), 0)
          return { date: dateStr, amount: dayAmount }
        })

        const ordPoints = last7Days.map(dateStr => {
          const count = (chartOrders || [])
            .filter(o => o.created_at.startsWith(dateStr)).length
          return { date: dateStr, count }
        })

        setChartData({
          revenuePoints: revPoints,
          orderPoints: ordPoints
        })

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#697386', fontFamily: 'var(--font)' }}>Loading overview metrics...</div>

  const isSmall = windowWidth < 768

  // Calculate Revenue line points dynamically with inset mapping
  const maxRevenueVal = Math.max(...chartData.revenuePoints.map(p => p.amount), 1000)
  
  const width = 500
  const height = 150
  const paddingLeft = 48
  const paddingRight = 18
  const paddingTop = 15
  const paddingBottom = 32
  
  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom
  const bottomY = paddingTop + plotHeight
  
  const points = chartData.revenuePoints.map((p, idx) => {
    const x = paddingLeft + (idx / 6) * plotWidth
    const y = bottomY - (p.amount / maxRevenueVal) * plotHeight
    return { x, y }
  })

  const getBezierPath = (pts) => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`
    let d = `M ${pts[0].x},${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cp1x = p0.x + (p1.x - p0.x) / 3
      const cp1y = p0.y
      const cp2x = p0.x + 2 * (p1.x - p0.x) / 3
      const cp2y = p1.y
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`
    }
    return d
  }

  const bezierLine = getBezierPath(points)
  const bezierArea = points.length > 0 ? `${bezierLine} L ${points[points.length - 1].x},${bottomY} L ${points[0].x},${bottomY} Z` : ''

  // Grid lines and labels for Revenue Chart
  const revenueGridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const y = bottomY - ratio * plotHeight
    const value = ratio * maxRevenueVal
    return { y, value }
  })

  const revenueDateLabels = chartData.revenuePoints.map((p, idx) => {
    const x = paddingLeft + (idx / 6) * plotWidth
    let dateStr = ''
    try {
      const d = new Date(p.date)
      dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    } catch (e) {
      dateStr = p.date
    }
    return { x, label: dateStr }
  })

  // Calculate Order volume bars dynamically with inset mapping
  const maxOrdersVal = Math.max(...chartData.orderPoints.map(p => p.count), 5)

  const orderGridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const y = bottomY - ratio * plotHeight
    const value = ratio * maxOrdersVal
    return { y, value }
  })

  const orderDateLabels = chartData.orderPoints.map((p, idx) => {
    const x = paddingLeft + (idx / 6) * plotWidth
    let dateStr = ''
    try {
      const d = new Date(p.date)
      dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
    } catch (e) {
      dateStr = p.date
    }
    return { x, label: dateStr }
  })

  const barWidth = 16

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', margin: 0 }}>Dashboard Overview</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 13.5 }}>Real-time business insights, course engagements, and performance metrics.</p>
        </div>
        
        {/* Quick Actions Panel */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/admin/products')}
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            + Create Product
          </button>
          <button 
            onClick={() => navigate('/admin/announcements')}
            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#4f566b', padding: '8px 14px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            Broadcast Message
          </button>
          <button 
            onClick={() => navigate('/admin/orders')}
            style={{ background: '#fff', border: '1px solid #cbd5e1', color: '#4f566b', padding: '8px 14px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', fontSize: 13, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            View Payouts
          </button>
        </div>
      </div>

      {/* Unanswered Q&A Widget */}
      {stats.unansweredQna > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 18px', borderRadius: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'rgba(245,158,11,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 500, color: '#92400e' }}>You have <strong>{stats.unansweredQna}</strong> unanswered student questions in your classes.</span>
          </div>
          <Link to="/admin/qna" style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Answer Now &rarr;</Link>
        </div>
      )}

      {/* ── PREMIUM STATS CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        
        {/* Net Revenue */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', padding: '22px 20px', borderRadius: 12, boxShadow: '0 4px 20px rgba(37,99,235,0.35)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 10, width: 100, height: 100, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Net Revenue</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>₦{stats.revenue.toLocaleString()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, padding: '2px 7px', background: 'rgba(0,255,150,0.18)', color: '#4ade80', borderRadius: 20 }}>+14.3%</span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>vs last week</span>
          </div>
        </div>

        {/* Sales Count */}
        <div style={{ background: '#fff', padding: '22px 20px', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'rgba(37,99,235,0.05)', borderRadius: '0 12px 0 100%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#697386', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Sales Count</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(37,99,235,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.5px' }}>{stats.orders}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>{stats.conversionRate}%</span>
            <span style={{ color: '#697386' }}>conversion rate</span>
          </div>
        </div>

        {/* Total Learners */}
        <div style={{ background: '#fff', padding: '22px 20px', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'rgba(37,99,235,0.05)', borderRadius: '0 12px 0 100%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#697386', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Total Learners</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(37,99,235,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.5px' }}>{stats.users}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>Active</span>
            <span style={{ color: '#697386' }}>registered profiles</span>
          </div>
        </div>

        {/* Active Products */}
        <div style={{ background: '#fff', padding: '22px 20px', borderRadius: 12, border: '1px solid #e8edf3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: 'rgba(245,158,11,0.05)', borderRadius: '0 12px 0 100%' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: '#697386', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Active Products</h3>
            <div style={{ width: 32, height: 32, background: 'rgba(245,158,11,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M20 7H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/><path d="M16 3H8L4 7h16l-4-4z"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#1a1f36', letterSpacing: '-0.5px' }}>{stats.productsCount}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11 }}>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{stats.productsCount}</span>
            <span style={{ color: '#697386' }}>listed assets</span>
          </div>
        </div>

      </div>

      {/* ── MODERN CHARTS SECTION ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '1fr 1fr', gap: 16 }}>
        
        {/* Chart 1: Revenue Volume – Gradient Area Chart */}
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '20px 20px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Revenue Growth</h4>
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>Last 7 days · Live transactions</span>
            </div>
            <div style={{ display: 'flex', align: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.05))', color: '#2563eb', padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(37,99,235,0.15)' }}>● Live</span>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              ₦{chartData.revenuePoints.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Total this period</div>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <svg onClick={() => setHoveredRevenue(null)} viewBox="0 0 500 160" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="55%" stopColor="#2563eb" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="revLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <filter id="revGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              
              {/* Horizontal grid lines */}
              {revenueGridLines.map((line, idx) => (
                <g key={idx}>
                  <line x1={paddingLeft} y1={line.y} x2={width - paddingRight} y2={line.y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={paddingLeft - 6} y={line.y + 4} textAnchor="end" fill="#334155" fontSize="10" fontWeight="600">
                    {line.value >= 1000 ? `₦${(line.value/1000).toFixed(0)}k` : `₦${line.value.toFixed(0)}`}
                  </text>
                </g>
              ))}

              {chartData.revenuePoints.length > 0 && (
                <>
                  {/* Filled area */}
                  <path d={bezierArea} fill="url(#revGrad)" />
                  {/* Line stroke with gradient */}
                  <path d={bezierLine} fill="none" stroke="url(#revLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#revGlow)" />
                  {/* Data points */}
                  {chartData.revenuePoints.map((p, idx) => {
                    const x = paddingLeft + (idx / 6) * plotWidth
                    const y = bottomY - (p.amount / maxRevenueVal) * plotHeight
                    const isHovered = hoveredRevenue && hoveredRevenue.idx === idx
                    return (
                      <g key={idx}>
                        {isHovered && <circle cx={x} cy={y} r="10" fill="rgba(37,99,235,0.1)" />}
                        <circle
                          cx={x} cy={y}
                          r={isHovered ? "5.5" : "3.5"}
                          fill={isHovered ? "#1d4ed8" : "#2563eb"}
                          stroke="#fff" strokeWidth="2"
                          style={{ transition: 'r 0.15s ease, fill 0.15s ease', pointerEvents: 'none' }}
                        />
                        {/* Large transparent hover trigger area for easy interactivity */}
                        <circle
                          cx={x} cy={y}
                          r="18"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                            const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                            const topPct = (rect.top - svgRect.top) / svgRect.height * 100
                            setHoveredRevenue({ leftPct, topPct, value: `₦${p.amount.toLocaleString()}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                          }}
                          onMouseLeave={() => setHoveredRevenue(null)}
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                            const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                            const topPct = (rect.top - svgRect.top) / svgRect.height * 100
                            setHoveredRevenue({ leftPct, topPct, value: `₦${p.amount.toLocaleString()}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                          }}
                        />
                      </g>
                    )
                  })}
                </>
              )}

              {/* X-axis date labels */}
              {revenueDateLabels.map((lbl, idx) => (
                <text key={idx} x={lbl.x} y={height - 8} textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
                  {lbl.label}
                </text>
              ))}
            </svg>

            {hoveredRevenue && (
              <div style={{
                position: 'absolute',
                left: `${hoveredRevenue.leftPct}%`,
                top: `${hoveredRevenue.topPct}%`,
                transform: `translate(${hoveredRevenue.idx === 0 ? '0%' : (hoveredRevenue.idx === 6 ? '-100%' : '-50%')}, -120%)`,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(37,99,235,0.3)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                zIndex: 100,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: 13 }}>{hoveredRevenue.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{hoveredRevenue.date}</div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Order Volume – Modern Bar Chart */}
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '20px 20px 12px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflow: 'visible' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h4 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Order Volume</h4>
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 500 }}>Last 7 days · Daily checkouts</span>
            </div>
            <span style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(16,185,129,0.2)' }}>● Active</span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              {chartData.orderPoints.reduce((sum, p) => sum + p.count, 0)}
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>Total orders this period</div>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <svg onClick={() => setHoveredOrder(null)} viewBox="0 0 500 160" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                </linearGradient>
              </defs>
              
              {/* Grid lines */}
              {orderGridLines.map((line, idx) => (
                <g key={idx}>
                  <line x1={paddingLeft} y1={line.y} x2={width - paddingRight} y2={line.y} stroke="#f1f5f9" strokeWidth="1" />
                  <text x={paddingLeft - 6} y={line.y + 4} textAnchor="end" fill="#334155" fontSize="10" fontWeight="600">
                    {Math.round(line.value)}
                  </text>
                </g>
              ))}

              {chartData.orderPoints.map((p, idx) => {
                const xCenter = paddingLeft + (idx / 6) * plotWidth
                const x = xCenter - barWidth / 2
                const barHeight = Math.max((p.count / maxOrdersVal) * plotHeight, p.count > 0 ? 6 : 2)
                const y = bottomY - barHeight
                const isHov = hoveredOrder && hoveredOrder.idx === idx
                return (
                  <g key={idx}>
                    {isHov && <rect x={x - 2} y={y - 2} width={barWidth + 4} height={barHeight + 2} rx="5" fill="rgba(16,185,129,0.15)" />}
                    <rect
                      x={x} y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 2)}
                      rx="4" ry="4"
                      fill={isHov ? "url(#barGradHover)" : "url(#barGrad)"}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Full height column hover target trigger */}
                    <rect
                      x={xCenter - 20}
                      y={paddingTop}
                      width={40}
                      height={plotHeight + 5}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                        const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                        const topPct = (y - 10) / height * 100
                        setHoveredOrder({ leftPct, topPct, value: `${p.count} checkout${p.count === 1 ? '' : 's'}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                      }}
                      onMouseLeave={() => setHoveredOrder(null)}
                      onClick={(e) => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        const svgRect = e.currentTarget.ownerSVGElement.getBoundingClientRect()
                        const leftPct = ((rect.left + rect.width/2) - svgRect.left) / svgRect.width * 100
                        const topPct = (y - 10) / height * 100
                        setHoveredOrder({ leftPct, topPct, value: `${p.count} checkout${p.count === 1 ? '' : 's'}`, date: new Date(p.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }), idx })
                      }}
                    />
                  </g>
                )
              })}

              {/* X-axis labels */}
              {orderDateLabels.map((lbl, idx) => (
                <text key={idx} x={lbl.x} y={height - 8} textAnchor="middle" fill="#334155" fontSize="10" fontWeight="600">
                  {lbl.label}
                </text>
              ))}
            </svg>

            {hoveredOrder && (
              <div style={{
                position: 'absolute',
                left: `${hoveredOrder.leftPct}%`,
                top: `${hoveredOrder.topPct}%`,
                transform: `translate(${hoveredOrder.idx === 0 ? '0%' : (hoveredOrder.idx === 6 ? '-100%' : '-50%')}, -120%)`,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 11.5,
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                zIndex: 100,
                whiteSpace: 'nowrap',
              }}>
                <div style={{ fontWeight: 700, color: '#34d399', fontSize: 13 }}>{hoveredOrder.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{hoveredOrder.date}</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── TWO-COLUMN ANALYTICS LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isSmall ? '1fr' : '2fr 1fr', gap: 20, alignItems: 'flex-start' }}>
        
        {/* Recent Payments Section */}
        <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #fafbff 0%, #f8fafc 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(37,99,235,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Recent Payments</h4>
            </div>
            <Link to="/admin/orders" style={{ fontSize: 12.5, color: '#2563eb', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="admin-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                  <th style={{ padding: '10px 20px', fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Product</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No payment logs recorded.</td></tr>
                ) : (
                  recentPayments.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '13px 20px', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>₦{p.amount.toLocaleString()}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13 }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          background: p.status === 'paid' ? 'rgba(16,185,129,0.1)' : p.status === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', 
                          color: p.status === 'paid' ? '#059669' : p.status === 'pending' ? '#d97706' : '#dc2626', 
                          borderRadius: 6, 
                          fontSize: 10.5, 
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{p.customer_name || p.customer_email}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#475569' }}>{p.products?.title || 'Unknown'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Course Performance Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Top Courses Progress Chart */}
          <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(37,99,235,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Course Enrollments</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stats.courseStats.length === 0 ? (
                <span style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>No active registrations.</span>
              ) : (
                (() => {
                  const maxEnroll = Math.max(...stats.courseStats.map(c => c.enrollmentsCount), 1)
                  const colors = ['#2563eb', '#3b82f6', '#10b981', '#f59e0b']
                  return stats.courseStats.slice(0, 4).map((c, idx) => {
                    const percentWidth = Math.round((c.enrollmentsCount / maxEnroll) * 100)
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{c.title}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: colors[idx % colors.length], flexShrink: 0, marginLeft: 8 }}>{c.enrollmentsCount}</span>
                        </div>
                        <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: `linear-gradient(90deg, ${colors[idx % colors.length]}, ${colors[idx % colors.length]}cc)`, width: `${percentWidth}%`, borderRadius: 4, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </div>

          {/* Latest Members */}
          <div style={{ background: '#fff', border: '1px solid #e8edf3', borderRadius: 12, padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, background: 'rgba(16,185,129,0.08)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </div>
              <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Latest Members</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {recentUsers.map((u, idx) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#fafbff', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, hsl(${idx * 60 + 220},65%,55%), hsl(${idx * 60 + 240},70%,45%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {(u.full_name || u.email || 'S')[0].toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name || 'Student'}</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const navigate = useNavigate()

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [productForm, setProductForm] = useState({
    title: '',
    slug: '',
    type: 'course',
    description: '',
    price: '',
    compare_price: '',
    cover_image: '',
    features: '',
    is_published: false,
    is_free: false
  })

  const loadProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setProductForm({
      title: '',
      slug: '',
      type: 'course',
      description: '',
      price: '',
      compare_price: '',
      cover_image: '',
      features: '',
      is_published: false,
      is_free: false
    })
    setShowModal(true)
  }

  const handleOpenEdit = (p) => {
    setEditingProduct(p)
    setProductForm({
      title: p.title || '',
      slug: p.slug || '',
      type: p.type || 'course',
      description: p.description || '',
      price: p.price || '',
      compare_price: p.old_price || '',
      cover_image: p.cover_image || '',
      features: Array.isArray(p.features) ? p.features.join('\n') : '',
      is_published: p.is_published || false,
      is_free: p.is_free || false
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      loadProducts()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!productForm.title.trim() || !productForm.slug.trim()) return
    setSubmitting(true)

    const isFree = productForm.is_free
    const payload = {
      title: productForm.title.trim(),
      slug: productForm.slug.trim(),
      type: productForm.type,
      description: productForm.description.trim(),
      price: isFree ? 0 : (parseInt(productForm.price) || 0),
      old_price: isFree ? null : (productForm.compare_price ? parseInt(productForm.compare_price) : null),
      cover_image: productForm.cover_image.trim() || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
      features: productForm.features.split('\n').map(f => f.trim()).filter(Boolean),
      is_published: productForm.is_published,
      is_free: isFree
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error

        if (payload.type === 'course') {
          const { error: cErr } = await supabase
            .from('courses')
            .insert({ id: data.id, level: 'beginner', what_you_learn: [] })
          if (cErr) throw cErr
        }
      }
      setShowModal(false)
      loadProducts()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' ? true : p.type === typeFilter
    return matchesSearch && matchesType
  })

  const isMobile = windowWidth < 768

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1a1f36', margin: 0 }}>Products</h2>
          <p style={{ color: '#697386', marginTop: 4, fontSize: 14 }}>Configure course catalogs, eBook items, and prices.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 4, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.08)' }}
        >
          + Add Product
        </button>
      </div>

      {/* ── Advanced Filter Row ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: searchQuery ? '#fff' : '#f7f8fa',
          border: `1.5px solid ${searchQuery ? '#2563eb' : '#e2e8f0'}`,
          borderRadius: 10,
          padding: '0 10px',
          flex: 1,
          minWidth: 220,
          maxWidth: 360,
          transition: 'all 0.2s ease',
          boxShadow: searchQuery ? '0 0 0 3px rgba(37,99,235,0.08)' : 'none',
          gap: 8
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={searchQuery ? '#2563eb' : '#94a3b8'} strokeWidth="2" style={{ flexShrink: 0, transition: 'stroke 0.2s' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search products by name or slug..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
            style={{ 
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: '8px 0',
              fontSize: 13, 
              outline: 'none',
              color: '#0f172a',
              fontFamily: 'var(--font)'
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: '#e2e8f0', border: 'none', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', fontSize: 12, fontWeight: 700, padding: 0, flexShrink: 0 }}>×</button>
          )}
        </div>
        
        {/* Type filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'course', 'ebook'].map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: `1.5px solid ${typeFilter === type ? '#2563eb' : '#e2e8f0'}`,
                background: typeFilter === type ? '#2563eb' : '#fff',
                color: typeFilter === type ? '#fff' : '#64748b',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
                fontFamily: 'var(--font)'
              }}
            >
              {type === 'all' ? 'All Types' : type === 'course' ? 'Courses' : 'eBooks'}
            </button>
          ))}
        </div>

        {/* Results count */}
        {(searchQuery || typeFilter !== 'all') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              <strong style={{ color: '#0f172a' }}>{filteredProducts.length}</strong> result{filteredProducts.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => { setSearchQuery(''); setTypeFilter('all') }}
              style={{ fontSize: 11.5, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, color: '#697386', fontSize: 13 }}>Loading products...</div>
      ) : isMobile ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#697386', fontSize: 13 }}>No products found</div>
          ) : (
            filteredProducts.map(p => (
              <div key={p.id} style={{ background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e3e8ee' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <img src={p.cover_image} alt={p.title} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1f36' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: '#697386', textTransform: 'uppercase', marginTop: 2 }}>{p.type}</div>
                  </div>
                </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: p.is_free ? '#10b981' : '#1a1f36' }}>
                    {p.is_free ? 'FREE' : `₦${p.price.toLocaleString()}`}
                  </span>
                  <span style={{ padding: '2px 6px', background: p.is_published ? '#e3fcef' : '#f7f8f9', color: p.is_published ? '#00875a' : '#697386', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                    {p.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #f7f8f9', paddingTop: 10 }}>
                  {p.type === 'course' && (
                    <button 
                      onClick={() => navigate(`/admin/courses/${p.id}`)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                    >
                      Curriculum
                    </button>
                  )}
                  <button 
                    onClick={() => handleOpenEdit(p)}
                    style={{ background: 'none', border: 'none', color: '#4f566b', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    style={{ background: 'none', border: 'none', color: '#ae2a19', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e3e8ee', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f8f9', borderBottom: '1px solid #e3e8ee' }}>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Cover</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Title</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Type</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Price</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: '12px 20px', color: '#697386', fontSize: 11, textTransform: 'uppercase', fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', color: '#697386', fontSize: 13 }}>No products found</td></tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f7f8f9' }}>
                      <td style={{ padding: '12px 20px' }}>
                        <img src={p.cover_image} alt={p.title} style={{ width: 44, height: 28, objectFit: 'cover', borderRadius: 4 }} />
                      </td>
                      <td style={{ padding: '12px 20px', fontWeight: 500, color: '#1a1f36', fontSize: 14 }}>{p.title}</td>
                      <td style={{ padding: '12px 20px', textTransform: 'uppercase', color: '#4f566b', fontSize: 12, fontWeight: 500 }}>{p.type}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 600, fontSize: 13, color: p.is_free ? '#10b981' : '#1a1f36' }}>
                        {p.is_free ? 'FREE' : `₦${p.price.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '2px 6px', background: p.is_published ? '#e3fcef' : '#f7f8f9', color: p.is_published ? '#00875a' : '#697386', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                          {p.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', gap: 14 }}>
                          {p.type === 'course' && (
                            <button 
                              onClick={() => navigate(`/admin/courses/${p.id}`)}
                              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                            >
                              Curriculum
                            </button>
                          )}
                          <button 
                            onClick={() => handleOpenEdit(p)}
                            style={{ background: 'none', border: 'none', color: '#4f566b', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)}
                            style={{ background: 'none', border: 'none', color: '#ae2a19', fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', padding: isMobile ? '28px 20px' : '32px 28px', borderRadius: 12, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 20, color: '#1a1f36' }}>
              {editingProduct ? 'Edit Product Details' : 'Register New Product'}
            </h3>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Product Name *</label>
                <input 
                  type="text" 
                  value={productForm.title} 
                  onChange={e => {
                    const title = e.target.value
                    setProductForm({ 
                      ...productForm, 
                      title, 
                      slug: editingProduct ? productForm.slug : generateSlug(title) 
                    })
                  }} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Slug / URL Segment *</label>
                <input 
                  type="text" 
                  value={productForm.slug} 
                  onChange={e => setProductForm({ ...productForm, slug: generateSlug(e.target.value) })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Type *</label>
                  <select 
                    value={productForm.type} 
                    onChange={e => setProductForm({ ...productForm, type: e.target.value })} 
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
                    <option value="course">Course</option>
                    <option value="ebook">eBook</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Price (NGN) *</label>
                  <input 
                    type="number" 
                    value={productForm.is_free ? '0' : productForm.price} 
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, backgroundColor: productForm.is_free ? '#f1f5f9' : '#fff' }} 
                    required={!productForm.is_free} 
                    disabled={productForm.is_free}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Compare Price (NGN)</label>
                  <input 
                    type="number" 
                    value={productForm.is_free ? '' : productForm.compare_price} 
                    onChange={e => setProductForm({ ...productForm, compare_price: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, backgroundColor: productForm.is_free ? '#f1f5f9' : '#fff' }} 
                    disabled={productForm.is_free}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Cover Image URL</label>
                  <input 
                    type="url" 
                    value={productForm.cover_image} 
                    onChange={e => setProductForm({ ...productForm, cover_image: e.target.value })} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13 }} 
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Description</label>
                <textarea 
                  value={productForm.description} 
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 60 }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Features (one per line)</label>
                <textarea 
                  value={productForm.features} 
                  onChange={e => setProductForm({ ...productForm, features: e.target.value })} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 60 }} 
                  placeholder="20+ Premium Videos&#10;Downloadable resources"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    id="is_free" 
                    checked={productForm.is_free} 
                    onChange={e => setProductForm({ ...productForm, is_free: e.target.checked })} 
                    style={{ width: 14, height: 14 }} 
                  />
                  <label htmlFor="is_free" style={{ fontWeight: 500, fontSize: 13, color: '#3c4257' }}>Free Product</label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    id="is_published" 
                    checked={productForm.is_published} 
                    onChange={e => setProductForm({ ...productForm, is_published: e.target.checked })} 
                    style={{ width: 14, height: 14 }} 
                  />
                  <label htmlFor="is_published" style={{ fontWeight: 500, fontSize: 13, color: '#3c4257' }}>Publish Product</label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  style={{ flex: 1, background: '#f7f8f9', color: '#4f566b', border: '1px solid #cbd5e1', padding: '10px', borderRadius: 4, fontWeight: 500, cursor: 'pointer' }}
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

export default function AdminDashboard() {
  const { user, profile, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true'
  })
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  const [expandedTabs, setExpandedTabs] = useState(() => {
    const active = {}
    if (location.pathname.includes('/courses') || location.pathname.includes('/qna') || location.pathname.includes('/reviews')) active.Academics = true
    if (location.pathname.includes('/users')) active['Users & Staff'] = true
    if (location.pathname.includes('/orders') || location.pathname.includes('/coupons') || location.pathname.includes('/products') || location.pathname.includes('/affiliates') || location.pathname.includes('/payouts') || location.pathname.includes('/upsells')) active.Sales = true
    if (location.pathname.includes('/settings') || location.pathname.includes('/announcements')) active.Management = true
    return active
  })

  useEffect(() => {
    setExpandedTabs(prev => {
      const active = { ...prev }
      if (location.pathname.includes('/courses') || location.pathname.includes('/qna') || location.pathname.includes('/reviews')) active.Academics = true
      if (location.pathname.includes('/users')) active['Users & Staff'] = true
      if (location.pathname.includes('/orders') || location.pathname.includes('/coupons') || location.pathname.includes('/products') || location.pathname.includes('/affiliates') || location.pathname.includes('/payouts') || location.pathname.includes('/upsells')) active.Sales = true
      if (location.pathname.includes('/settings') || location.pathname.includes('/announcements')) active.Management = true
      return active
    })
  }, [location.pathname])

  // Custom Header Dropdowns States
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [globalSearch, setGlobalSearch] = useState('')
  const [globalResults, setGlobalResults] = useState([])
  const [searching, setSearching] = useState(false)

  const profileRef = useRef(null)
  const notificationRef = useRef(null)
  const searchRef = useRef(null)

  // Fetch real-time alerts from recent database mutations
  useEffect(() => {
    async function loadAlerts() {
      try {
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, reference, customer_name, amount, created_at')
          .order('created_at', { ascending: false })
          .limit(3)
        
        const { data: recentProfiles } = await supabase
          .from('profiles')
          .select('id, email, created_at')
          .order('created_at', { ascending: false })
          .limit(3)

        const readAlerts = JSON.parse(localStorage.getItem('adminReadAlerts') || '[]')
        const merged = []
        if (recentOrders) {
          recentOrders.forEach(o => {
            const id = `order-${o.id}`
            merged.push({
              id,
              msg: `New Payment: ₦${o.amount.toLocaleString()} from ${o.customer_name || 'Customer'} (Ref: ${o.reference.slice(0, 8)})`,
              time: new Date(o.created_at).toLocaleDateString() + ' ' + new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: readAlerts.includes(id)
            })
          })
        }
        if (recentProfiles) {
          recentProfiles.forEach(p => {
            const id = `user-${p.id}`
            merged.push({
              id,
              msg: `New Student registered: ${p.email}`,
              time: new Date(p.created_at).toLocaleDateString() + ' ' + new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: readAlerts.includes(id)
            })
          })
        }
        setAlerts(merged)
      } catch (err) {
        console.error(err)
      }
    }
    if (user) loadAlerts()
  }, [user])

  // Global search autocomplete debouncing logic
  useEffect(() => {
    if (!globalSearch.trim()) {
      setGlobalResults([])
      return
    }
    setSearching(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const query = globalSearch.trim().toLowerCase()
        const results = []

        // Query Products
        const { data: prods } = await supabase.from('products').select('id, title').ilike('title', `%${query}%`).limit(3)
        if (prods) {
          prods.forEach(p => results.push({
            type: 'product',
            title: p.title,
            subtitle: 'Product Catalog',
            path: `/admin/products`
          }))
        }

        // Query Profiles
        const { data: profs } = await supabase.from('profiles').select('id, email, full_name').or(`email.ilike.%${query}%,full_name.ilike.%${query}%`).limit(3)
        if (profs) {
          profs.forEach(p => results.push({
            type: 'user',
            title: p.full_name || p.email,
            subtitle: `Student Email: ${p.email}`,
            path: `/admin/users`
          }))
        }

        // Query Orders
        const { data: ords } = await supabase.from('orders').select('id, reference, customer_email').or(`reference.ilike.%${query}%,customer_email.ilike.%${query}%`).limit(3)
        if (ords) {
          ords.forEach(o => results.push({
            type: 'order',
            title: `Order Ref: #${(o.reference || 'N/A').slice(0, 12)}`,
            subtitle: `Customer: ${o.customer_email || 'Anonymous'}`,
            path: `/admin/orders`
          }))
        }

        setGlobalResults(results)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [globalSearch])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotificationDropdown(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setGlobalResults([])
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  const toggleSidebar = () => {
    const nextVal = !sidebarCollapsed
    setSidebarCollapsed(nextVal)
    localStorage.setItem('adminSidebarCollapsed', String(nextVal))
  }

  const handleMarkAllRead = () => {
    const allIds = alerts.map(a => a.id)
    localStorage.setItem('adminReadAlerts', JSON.stringify(allIds))
    setAlerts(alerts.map(a => ({ ...a, read: true })))
  }

  const handleMarkSingleRead = (id) => {
    const readAlerts = JSON.parse(localStorage.getItem('adminReadAlerts') || '[]')
    if (!readAlerts.includes(id)) {
      readAlerts.push(id)
      localStorage.setItem('adminReadAlerts', JSON.stringify(readAlerts))
    }
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a))
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#697386', fontFamily: 'var(--font)' }}>Loading Admin Session...</div>
  
  if (!user) {
    return null
  }

  if (profile?.role !== 'admin' && user?.app_metadata?.role !== 'admin') {
    return (
      <div style={{ padding: '100px 20px', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', fontFamily: 'var(--font)' }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: '#1a1f36' }}>Access Denied</h1>
        <p style={{ color: '#697386', marginBottom: 24, fontSize: 14 }}>You do not have administrative privileges to view this portal.</p>
        <Link to="/" style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>Return to Home</Link>
      </div>
    )
  }

  const menuGroups = [
    { 
      name: 'Overview', 
      path: '/admin', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" /> 
    },
    { 
      name: 'Academics', 
      path: '/admin/courses', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
      subItems: [
        { name: 'All Courses', path: '/admin/courses' },
        { name: 'Q&A Support', path: '/admin/qna' },
        { name: 'Student Reviews', path: '/admin/reviews' }
      ]
    },
    { 
      name: 'Sales', 
      path: '/admin/products', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
      subItems: [
        { name: 'Products', path: '/admin/products' },
        { name: 'Orders', path: '/admin/orders' },
        { name: 'Discount Coupons', path: '/admin/coupons' },
        { name: 'Affiliates', path: '/admin/affiliates' },
        { name: 'Payouts', path: '/admin/payouts' },
        { name: 'Upsells & Cross-sells', path: '/admin/upsells' }
      ]
    },
    { 
      name: 'Users & Staff', 
      path: '/admin/users', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      subItems: [
        { name: 'All Profiles', path: '/admin/users' },
        { name: 'Enrolled Students', path: '/admin/users?role=user' },
        { name: 'Instructors & Staff', path: '/admin/users?role=admin' }
      ]
    },
    { 
      name: 'Management', 
      path: '/admin/settings', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />,
      subItems: [
        { name: 'Platform Settings', path: '/admin/settings' },
        { name: 'Certificates', path: '/admin/certificates' },
        { name: 'Broadcast Emails', path: '/admin/announcements' }
      ]
    },
    { 
      name: 'Frontend Pages', 
      path: '/admin/pages', 
      icon: <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </>
    }
  ]

  const isTablet = windowWidth < 1024
  const isSmall = windowWidth < 768
  const sidebarWidth = sidebarCollapsed ? 72 : 240
  const unreadCount = alerts.filter(a => !a.read).length

  const sidebarContent = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: '20px 0 0 0', 
      background: '#0F172A', 
      borderRight: '1px solid #1E293B',
      color: '#fff',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Brand area */}
      <div style={{ padding: sidebarCollapsed ? '0 12px' : '0 20px', marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              height: sidebarCollapsed ? 28 : 40,
              width: 'auto',
              maxWidth: sidebarCollapsed ? 40 : 160,
              objectFit: 'contain',
              objectPosition: 'left center',
              flexShrink: 0,
              transition: 'all 0.3s ease',
              display: 'block',
              filter: 'brightness(0) invert(1)'
            }} 
          />
        </div>
      </div>

      {/* Navigation tabs */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, padding: '0 10px', overflowY: 'auto' }}>
        {menuGroups.map(t => {
          const hasSubItems = t.subItems && t.subItems.length > 0
          const isExpanded = expandedTabs[t.name]
          const isParentActive = location.pathname === t.path || (t.path !== '/admin' && location.pathname.startsWith(t.path))

          return (
            <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {hasSubItems ? (
                <button
                  onClick={() => {
                    if (sidebarCollapsed) {
                      setSidebarCollapsed(false)
                      setExpandedTabs(prev => ({ ...prev, [t.name]: true }))
                    } else {
                      setExpandedTabs(prev => ({ ...prev, [t.name]: !prev[t.name] }))
                    }
                  }}
                  title={sidebarCollapsed ? t.name : undefined}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: isParentActive ? '#1E293B' : 'transparent',
                    padding: '10px 14px',
                    color: isParentActive ? '#fff' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 500,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                    gap: 12,
                    fontSize: 13.5,
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
                      {t.icon}
                    </svg>
                    {!sidebarCollapsed && <span>{t.name}</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      style={{ 
                        transform: isExpanded ? 'rotate(90deg)' : 'none', 
                        transition: 'transform 0.2s', 
                        color: '#64748b' 
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ) : (
                <Link
                  to={t.path}
                  title={sidebarCollapsed ? t.name : undefined}
                  style={{
                    padding: '10px 14px',
                    color: location.pathname === t.path ? '#fff' : '#94a3b8',
                    textDecoration: 'none',
                    fontWeight: 500,
                    background: location.pathname === t.path ? '#1E293B' : 'transparent',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    gap: 12,
                    fontSize: 13.5,
                    transition: 'all 0.2s'
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 18, height: 18, flexShrink: 0 }}>
                    {t.icon}
                  </svg>
                  {!sidebarCollapsed && <span>{t.name}</span>}
                </Link>
              )}

              {/* Render sub items if expanded and sidebar is not collapsed */}
              {hasSubItems && isExpanded && !sidebarCollapsed && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2, 
                  marginLeft: 26, 
                  borderLeft: '1px solid #334155', 
                  paddingLeft: 12,
                  marginTop: 2,
                  marginBottom: 4
                }}>
                  {t.subItems.map(sub => {
                    const isSubActive = location.pathname === sub.path || (location.search ? `${location.pathname}${location.search}` === sub.path : false)
                    return (
                      <Link
                        key={sub.name}
                        to={sub.path}
                        style={{
                          padding: '6px 12px',
                          color: isSubActive ? '#fff' : '#94a3b8',
                          textDecoration: 'none',
                          fontSize: 12.5,
                          fontWeight: 500,
                          borderRadius: 4,
                          background: isSubActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                          transition: 'color 0.2s, background-color 0.2s'
                        }}
                      >
                        {sub.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Profile Details */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #1E293B', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 16,
        background: '#0B0F19' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          <img 
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
            alt="Admin Profile" 
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #2563eb' }} 
          />
          {!sidebarCollapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 500 }}>Super Admin</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f7f8f9', fontFamily: 'var(--font)' }}>
      
      {/* Sidebar - Desktop */}
      {!isTablet && (
        <aside style={{ 
          width: sidebarWidth, 
          height: '100vh', 
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}>
          {sidebarContent}
        </aside>
      )}

      {/* Sidebar - Mobile/Tablet Drawer */}
      {isTablet && mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(11,15,25,0.2)', backdropFilter: 'blur(2px)', zIndex: 998 }}
          />
          <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 240, zIndex: 999 }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content Area - Full height, scrolling internally */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0 }}>
        
        {/* Top Header */}
        <header style={{ 
          background: '#ffffff', 
          borderBottom: '1px solid #e3e8ee', 
          height: 56, 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 24px', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isTablet ? (
              <button 
                onClick={() => setMobileMenuOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1a1f36', padding: 4 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
            ) : (
              <button 
                onClick={toggleSidebar}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#697386', padding: 4 }}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* ── ADVANCED SEARCH BAR ── */}
            <div ref={searchRef} style={{ position: 'relative', display: isSmall ? 'none' : 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: globalSearch ? '#fff' : '#f7f8fa',
                border: `1.5px solid ${globalSearch ? '#2563eb' : '#e2e8f0'}`,
                borderRadius: 10,
                padding: '0 8px 0 0',
                width: 300,
                transition: 'all 0.2s ease',
                boxShadow: globalSearch ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                overflow: 'hidden'
              }}>
                {/* Search icon */}
                <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: globalSearch ? '#2563eb' : '#94a3b8', transition: 'color 0.2s', flexShrink: 0 }}>
                  {searching ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                  )}
                </div>
                <input 
                  type="text" 
                  placeholder="Search anything… (⌘K)"
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') { setGlobalSearch(''); setGlobalResults([]) } }}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '8px 0', 
                    fontSize: 13, 
                    flex: 1,
                    outline: 'none',
                    color: '#0f172a',
                    fontFamily: 'var(--font)',
                    minWidth: 0
                  }}
                />
                {/* Keyboard shortcut hint / clear btn */}
                {globalSearch ? (
                  <button
                    onClick={() => { setGlobalSearch(''); setGlobalResults([]) }}
                    style={{ background: '#e2e8f0', border: 'none', borderRadius: 4, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', flexShrink: 0, fontSize: 11, fontWeight: 700, padding: 0 }}
                  >×</button>
                ) : (
                  <kbd style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 5px', fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0, whiteSpace: 'nowrap' }}>⌘K</kbd>
                )}
              </div>

              {/* Search results dropdown */}
              {globalResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: 360,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)',
                  zIndex: 9999,
                  overflow: 'hidden',
                  animation: 'fadeSlideIn 0.15s ease'
                }}>
                  {/* Header */}
                  <div style={{ padding: '10px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {globalResults.length} result{globalResults.length !== 1 ? 's' : ''} found
                    </span>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>ESC to close</span>
                  </div>

                  {/* Result items */}
                  {globalResults.map((res, i) => {
                    const typeIcons = {
                      product: { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
                      user: { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
                      order: { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>, color: '#10b981', bg: 'rgba(16,185,129,0.08)' }
                    }
                    const typeStyle = typeIcons[res.type] || typeIcons.product
                    return (
                      <div 
                        key={i}
                        onClick={() => { setGlobalSearch(''); setGlobalResults([]); navigate(res.path) }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          borderBottom: i < globalResults.length - 1 ? '1px solid #f8fafc' : 'none',
                          transition: 'background 0.12s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: typeStyle.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {typeStyle.icon}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{res.subtitle}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: typeStyle.color, background: typeStyle.bg, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {res.type}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {/* Footer */}
                  <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 16 }}>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>↑↓ Navigate</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>↵ Open</span>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>ESC Dismiss</span>
                  </div>
                </div>
              )}
              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            
            {/* Custom Notifications Bell with Dropdown */}
            <div ref={notificationRef} style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, position: 'relative', display: 'flex', alignItems: 'center', color: '#4f566b' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ae2a19', borderRadius: '50%' }} />
                )}
              </button>

              {showNotificationDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  top: 32, 
                  right: 0, 
                  width: 280, 
                  background: '#fff', 
                  border: '1px solid #e3e8ee', 
                  borderRadius: 6, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', 
                  zIndex: 200,
                  padding: '8px 0'
                }}>
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #f7f8f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1f36' }}>Notifications</span>
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {alerts.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 12 }}>No new activity logs.</div>
                    ) : (
                      alerts.map(a => (
                        <div 
                          key={a.id} 
                          onClick={() => handleMarkSingleRead(a.id)}
                          style={{ padding: '10px 16px', borderBottom: '1px solid #f7f8f9', background: a.read ? '#fff' : '#f7f8f9', cursor: 'pointer', transition: 'background 0.15s' }}
                        >
                          <p style={{ margin: 0, fontSize: 12, color: '#3c4257', lineHeight: 1.4, fontWeight: a.read ? 400 : 600 }}>{a.msg}</p>
                          <span style={{ fontSize: 10, color: '#8792a2', marginTop: 4, display: 'block' }}>{a.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <img 
                  src={profile?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                  alt="Avatar" 
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#697386" strokeWidth="2.5" style={{ transform: showProfileDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {showProfileDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  top: 36, 
                  right: 0, 
                  width: 160, 
                  background: '#fff', 
                  border: '1px solid #e3e8ee', 
                  borderRadius: 6, 
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)', 
                  zIndex: 200,
                  padding: '4px 0'
                }}>
                  <Link to="/admin/settings" onClick={() => setShowProfileDropdown(false)} style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#3c4257', textDecoration: 'none', fontWeight: 500 }}>
                    My Account
                  </Link>
                  <Link to="/admin/settings" onClick={() => setShowProfileDropdown(false)} style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#3c4257', textDecoration: 'none', fontWeight: 500 }}>
                    Settings
                  </Link>
                  <div style={{ borderTop: '1px solid #f7f8f9', margin: '4px 0' }} />
                  <button 
                    onClick={() => { setShowProfileDropdown(false); logout(); navigate('/login') }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 16px', fontSize: 13, color: '#ae2a19', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Scrollable workspace content */}
        <main style={{ flex: 1, padding: isTablet ? '20px 16px' : '32px 40px', overflowY: 'auto', background: '#f7f8f9' }}>
          <Routes>
            <Route path="/" element={<AdminOverview />} />
            <Route path="/products" element={<AdminProducts />} />
            <Route path="/courses" element={<AdminCourses />} />
            <Route path="/courses/:id" element={<AdminCourseBuilder />} />
            <Route path="/users" element={<AdminUsers />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/qna" element={<AdminQnA />} />
            <Route path="/announcements" element={<AdminAnnouncements />} />
            <Route path="/coupons" element={<AdminCoupons />} />
            <Route path="/reviews" element={<AdminReviews />} />
            <Route path="/certificates" element={<AdminCertificates />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="/pages" element={<AdminPages />} />
            <Route path="/affiliates" element={<AdminAffiliates />} />
            <Route path="/payouts" element={<AdminPayouts />} />
            <Route path="/upsells" element={<AdminUpsells />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
