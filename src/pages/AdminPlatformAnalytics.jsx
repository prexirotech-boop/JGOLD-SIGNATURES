import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Helper Utilities (Declared at top to prevent ReferenceError)
const formatNaira = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export default function AdminPlatformAnalytics() {
  const [timeframe, setTimeframe] = useState('30d') // 'today', 'yesterday', '7d', '30d', 'all'
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'revenue', 'sales', 'students', 'products'
  
  // Database States
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [profiles, setProfiles] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [trafficEvents, setTrafficEvents] = useState([])

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductFilter, setSelectedProductFilter] = useState('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [timeframe])

  async function loadData() {
    setLoading(true)
    try {
      const now = new Date()
      const start = new Date(now)
      let end = null

      if (timeframe === 'today') {
        start.setHours(0, 0, 0, 0)
      } else if (timeframe === 'yesterday') {
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(now)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 59, 59, 999)
      } else if (timeframe === '7d') {
        start.setDate(start.getDate() - 7)
      } else if (timeframe === '30d') {
        start.setDate(start.getDate() - 30)
      } else {
        start.setTime(0) // All time
      }

      let qOrders = supabase
        .from('orders')
        .select('*, products(id, title, price, type)')
        .gte('created_at', start.toISOString())
      if (end) {
        qOrders = qOrders.lte('created_at', end.toISOString())
      }

      let qProfiles = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      // Fixed relations join from enrollments -> courses -> products -> title
      let qEnrollments = supabase
        .from('enrollments')
        .select('*, courses(id, products(title))')
        .order('created_at', { ascending: false })

      let qTraffic = supabase
        .from('traffic_events')
        .select('id, event_name, page_path, created_at, session_id')
        .gte('created_at', start.toISOString())
      if (end) {
        qTraffic = qTraffic.lte('created_at', end.toISOString())
      }

      const [
        { data: fetchedOrders },
        { data: fetchedProducts },
        { data: fetchedProfiles },
        { data: fetchedEnrollments },
        { data: fetchedTraffic }
      ] = await Promise.all([
        qOrders.order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        qProfiles,
        qEnrollments,
        qTraffic
      ])

      setOrders(fetchedOrders || [])
      setProducts(fetchedProducts || [])
      setProfiles(fetchedProfiles || [])
      setEnrollments(fetchedEnrollments || [])
      setTrafficEvents(fetchedTraffic || [])

    } catch (e) {
      console.error('[AdminPlatformAnalytics] Failed to load statistics:', e)
    } finally {
      setLoading(false)
    }
  }

  // ─── CALCULATE OVERALL PLATFORM STATISTICS (REAL DATA ONLY) ──────────────────
  const paidOrders = orders.filter(o => o.status === 'paid')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0)
  const totalOrdersCount = orders.length
  
  const studentProfiles = profiles.filter(p => p.role === 'user' || !p.role)
  const totalStudents = studentProfiles.length
  
  const activeProducts = products.filter(p => p.is_published).length
  const aov = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0

  // ─── DATA GENERATION FOR GRAPH / CHARTS (SVG BASED) ────────────────────────
  const getRevenueGraphPoints = () => {
    if (paidOrders.length === 0) return []

    const dailyData = {}
    paidOrders.forEach(o => {
      const dateStr = new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
      dailyData[dateStr] = (dailyData[dateStr] || 0) + (o.amount || 0)
    })

    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b))
    return sortedDates.map(date => ({
      label: date,
      value: dailyData[date]
    }))
  }

  const getProductPerformanceStats = () => {
    return products.map(prod => {
      const productOrders = paidOrders.filter(o => o.product_id === prod.id)
      const copiesSold = productOrders.length
      const revenue = productOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

      const productDetailsViews = new Set(
        trafficEvents
          .filter(e => e.event_name === 'page_view' && (e.page_path === `/product/${prod.slug}` || e.page_path.includes(prod.id)))
          .map(e => e.session_id)
      ).size

      const conversion = productDetailsViews ? ((copiesSold / productDetailsViews) * 100).toFixed(1) : '0.0'

      return {
        ...prod,
        copiesSold,
        revenue,
        views: productDetailsViews,
        conversion
      }
    }).sort((a, b) => b.revenue - a.revenue)
  }

  const revenueChartData = getRevenueGraphPoints()
  const productPerformance = getProductPerformanceStats()

  // ─── DETAIL DRILL DOWNS FILTERING ──────────────────────────────────────────
  const getFilteredSalesList = () => {
    return orders.filter(o => {
      const matchesSearch = !searchQuery ? true : (
        o.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      const matchesProduct = selectedProductFilter === 'all' ? true : o.product_id === selectedProductFilter
      const matchesStatus = selectedStatusFilter === 'all' ? true : o.status === selectedStatusFilter
      return matchesSearch && matchesProduct && matchesStatus
    })
  }

  const getFilteredStudentsList = () => {
    const studentsEnriched = studentProfiles.map(student => {
      const studentEnrolls = enrollments.filter(e => e.user_id === student.id)
      const enrolledCoursesTitles = studentEnrolls.map(e => e.courses?.products?.title || 'Unknown Course')
      return {
        ...student,
        coursesCount: studentEnrolls.length,
        coursesList: enrolledCoursesTitles.join(', ')
      }
    })

    return studentsEnriched.filter(student => {
      if (!searchQuery) return true
      return (
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }

  const displayFilteredSales = getFilteredSalesList()
  const displayFilteredStudents = getFilteredStudentsList()

  // ─── RENDERING PLOTS (PURE SVG & RESPONSIVE) ─────────────────────────────────
  const renderRevenueLineChart = () => {
    if (revenueChartData.length === 0) {
      return (
        <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13.5 }}>
          No transaction history available in the selected timeframe to plot.
        </div>
      )
    }

    const chartWidth = 800
    const chartHeight = 360
    const paddingLeft = 80
    const paddingRight = 30
    const paddingTop = 30
    const paddingBottom = 50
    
    const plotWidth = chartWidth - paddingLeft - paddingRight
    const plotHeight = chartHeight - paddingTop - paddingBottom

    const maxVal = Math.max(...revenueChartData.map(d => d.value)) * 1.15 || 1000

    const points = revenueChartData.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, revenueChartData.length - 1)) * plotWidth
      const y = paddingTop + plotHeight - (d.value / maxVal) * plotHeight
      return { x, y, label: d.label, val: d.value }
    })

    let pathString = ''
    if (points.length > 0) {
      pathString = `M ${points[0].x} ${points[0].y}`
      for (let i = 0; i < points.length - 1; i++) {
        const cp1x = points[i].x + (points[i+1].x - points[i].x) / 3
        const cp1y = points[i].y
        const cp2x = points[i+1].x - (points[i+1].x - points[i].x) / 3
        const cp2y = points[i+1].y
        pathString += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i+1].x} ${points[i+1].y}`
      }
    }

    let fillString = ''
    if (points.length > 0) {
      fillString = `${pathString} L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`
    }

    return (
      <div style={{ background: '#fff', padding: '24px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', position: 'relative' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
            const y = paddingTop + plotHeight * p
            const valLabel = formatNaira(Math.round(maxVal * (1 - p)))
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={paddingLeft + plotWidth} y2={y} stroke="#f1f5f9" strokeWidth="1.5" />
                <text x={paddingLeft - 12} y={y + 4} fill="#64748b" fontSize="11" textAnchor="end" fontWeight="600" fontFamily="var(--font)">
                  {valLabel}
                </text>
              </g>
            )
          })}

          {/* Line Fill */}
          {points.length > 0 && (
            <path d={fillString} fill="url(#chart-area-grad)" />
          )}

          {/* Line Path */}
          {points.length > 0 && (
            <path d={pathString} fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
          )}

          {/* X Axis Labels */}
          {points.map((pt, i) => {
            const skipStep = Math.ceil(points.length / 8)
            if (i % skipStep !== 0) return null
            return (
              <text key={i} x={pt.x} y={paddingTop + plotHeight + 22} fill="#64748b" fontSize="11" textAnchor="middle" fontWeight="600" fontFamily="var(--font)">
                {pt.label}
              </text>
            )
          })}

          {/* Interactive Guides & Tooltips */}
          {points.map((pt, i) => {
            const tooltipShift = i === 0 ? 20 : (i === points.length - 1 ? -20 : 0)
            const rectX = pt.x - 55 + tooltipShift
            const textX = pt.x + tooltipShift

            return (
              <g key={i} className="chart-point-group">
                {/* Hover Guide Line */}
                <line 
                  x1={pt.x} 
                  y1={paddingTop} 
                  x2={pt.x} 
                  y2={paddingTop + plotHeight} 
                  stroke="#2563eb" 
                  strokeWidth="1.2" 
                  strokeDasharray="4,4" 
                  className="chart-hover-line" 
                />
                
                {/* Tooltip Popup */}
                <g className="chart-tooltip">
                  {pt.y < 60 ? (
                    <>
                      <rect 
                        x={rectX} 
                        y={pt.y + 14} 
                        width="110" 
                        height="36" 
                        rx="6" 
                        fill="#0f172a" 
                      />
                      <polygon 
                        points={`${pt.x - 5},${pt.y + 14} ${pt.x + 5},${pt.y + 14} ${pt.x},${pt.y + 9}`} 
                        fill="#0f172a" 
                      />
                      <text 
                        x={textX} 
                        y={pt.y + 26} 
                        fill="#94a3b8" 
                        fontSize="9" 
                        fontWeight="600" 
                        textAnchor="middle"
                        fontFamily="var(--font)"
                      >
                        {pt.label}
                      </text>
                      <text 
                        x={textX} 
                        y={pt.y + 41} 
                        fill="#fff" 
                        fontSize="11.5" 
                        fontWeight="700" 
                        textAnchor="middle"
                        fontFamily="var(--font)"
                      >
                        {formatNaira(pt.val)}
                      </text>
                    </>
                  ) : (
                    <>
                      <rect 
                        x={rectX} 
                        y={pt.y - 50} 
                        width="110" 
                        height="36" 
                        rx="6" 
                        fill="#0f172a" 
                      />
                      <polygon 
                        points={`${pt.x - 5},${pt.y - 14} ${pt.x + 5},${pt.y - 14} ${pt.x},${pt.y - 9}`} 
                        fill="#0f172a" 
                      />
                      <text 
                        x={textX} 
                        y={pt.y - 38} 
                        fill="#94a3b8" 
                        fontSize="9" 
                        fontWeight="600" 
                        textAnchor="middle"
                        fontFamily="var(--font)"
                      >
                        {pt.label}
                      </text>
                      <text 
                        x={textX} 
                        y={pt.y - 23} 
                        fill="#fff" 
                        fontSize="11.5" 
                        fontWeight="700" 
                        textAnchor="middle"
                        fontFamily="var(--font)"
                      >
                        {formatNaira(pt.val)}
                      </text>
                    </>
                  )}
                </g>

                {/* Point Circle */}
                <circle cx={pt.x} cy={pt.y} r="5.5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
                
                {/* Large Invisible Hit Target */}
                <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" style={{ cursor: 'pointer' }} />
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1e293b' }}>
      
      {/* Responsive Style Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .responsive-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-top: 10px;
        }
        .responsive-table {
          width: 100%;
          border-collapse: collapse;
        }
        .table-dense {
          min-width: 900px;
        }
        .kpi-grid-platform-two-col {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        @media (max-width: 1024px) {
          .kpi-grid-platform-two-col {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .kpi-grid-platform-two-col {
            grid-template-columns: repeat(2, 1fr); /* Exactly 2 columns on mobile */
            gap: 12px;
          }
        }
        .overview-sections-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .overview-sections-grid {
            grid-template-columns: 1fr;
          }
        }
        .chart-point-group:hover .chart-hover-line {
          opacity: 0.55 !important;
        }
        .chart-point-group:hover .chart-tooltip {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(-2px);
        }
        .chart-tooltip {
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform: translateY(0);
          pointer-events: none;
        }
        .chart-hover-line {
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
      `}} />

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 28, 
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#0f172a' }}>Platform Analytics Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: 13.5 }}>
            Analyze sales history, revenue growth, student profiles, and product sales.
          </p>
        </div>
        
        {/* Timeframe Selector */}
        <div style={{ 
          background: '#fff', 
          border: '1px solid #e2e8f0', 
          padding: 4, 
          borderRadius: 8, 
          display: 'flex', 
          gap: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          {[
            { id: 'today', name: 'Today' },
            { id: 'yesterday', name: 'Yesterday' },
            { id: '7d', name: '7 Days' },
            { id: '30d', name: '30 Days' },
            { id: 'all', name: 'All Time' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              style={{
                border: 'none',
                background: timeframe === t.id ? '#2563eb' : 'transparent',
                color: timeframe === t.id ? '#fff' : '#64748b',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <div className="premium-spinner" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }' }} />
        </div>
      ) : (
        <>
          {/* KPI METRIC CARDS */}
          <div className="kpi-grid-platform-two-col">
            {[
              { label: 'Gross Revenue', val: formatNaira(totalRevenue), sub: `From ${paidOrders.length} paid orders`, color: '#2563eb', focus: true },
              { label: 'Total Sales (Orders)', val: totalOrdersCount, sub: `AOV: ${formatNaira(aov)}` },
              { label: 'Enrolled Students', val: totalStudents, sub: 'Total registered students database' },
              { label: 'Active Products', val: activeProducts, sub: `Published of ${products.length} products total` }
            ].map((k, i) => (
              <div 
                key={i} 
                style={{
                  background: k.focus ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' : '#fff',
                  color: k.focus ? '#fff' : '#0f172a',
                  padding: 20,
                  borderRadius: 12,
                  border: k.focus ? 'none' : '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontSize: 12.5, color: k.focus ? '#94a3b8' : '#64748b', fontWeight: 600 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 4px 0', wordBreak: 'break-all' }}>{k.val}</div>
                <div style={{ fontSize: 12, color: k.focus ? '#a5b4fc' : '#64748b', fontWeight: 500 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* TAB NAVIGATION */}
          <div className="no-scrollbar" style={{ 
            display: 'flex', 
            borderBottom: '1px solid #e2e8f0', 
            gap: 20, 
            marginBottom: 24,
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {[
              { id: 'overview', name: 'Growth Overview' },
              { id: 'revenue', name: `Revenue Details (${paidOrders.length})` },
              { id: 'sales', name: `Orders History (${orders.length})` },
              { id: 'students', name: `Students Profiles (${studentProfiles.length})` },
              { id: 'products', name: `Products Performance (${products.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: '12px 4px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: activeTab === tab.id ? '#2563eb' : '#64748b',
                  borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  paddingBottom: 10
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* OVERVIEW GROWTH */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 }}>Revenue Growth Curve</h3>
                {renderRevenueLineChart()}
              </div>

              <div className="overview-sections-grid">
                {/* Top Selling Products */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700 }}>Products Sales Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {productPerformance.slice(0, 5).map((prod) => (
                      <div key={prod.id} style={{ display: 'flex', alignItems: 'center', justify: 'space-between', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{prod.title}</div>
                          <span style={{ fontSize: 11.5, color: '#64748b', textTransform: 'capitalize' }}>Type: {prod.type}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{formatNaira(prod.revenue)}</div>
                          <span style={{ fontSize: 11.5, color: '#10b981', fontWeight: 600 }}>{prod.copiesSold} sold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales Status Breakdown */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700 }}>Orders Status Analysis</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { status: 'Paid', count: orders.filter(o => o.status === 'paid').length, color: '#10b981' },
                      { status: 'Pending', count: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
                      { status: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length, color: '#64748b' },
                      { status: 'Refunded', count: orders.filter(o => o.status === 'refunded').length, color: '#ef4444' }
                    ].map((st, idx) => {
                      const percentage = orders.length ? Math.round((st.count / orders.length) * 100) : 0
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4, fontWeight: 500 }}>
                            <span>{st.status}</span>
                            <span>{st.count} ({percentage}%)</span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${percentage}%`, height: '100%', background: st.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REVENUE DETAILS */}
          {activeTab === 'revenue' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Paid Revenue Log</h3>
              
              <div className="responsive-table-wrapper">
                <table className="responsive-table table-dense">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Reference</th>
                      <th style={{ padding: '12px 8px' }}>Customer</th>
                      <th style={{ padding: '12px 8px' }}>Product</th>
                      <th style={{ padding: '12px 8px' }}>Payment Method</th>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidOrders.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No paid orders found in this timeframe.
                        </td>
                      </tr>
                    ) : (
                      paidOrders.map((ord) => (
                        <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13.5, color: '#334155' }}>
                          <td style={{ padding: '14px 8px', fontWeight: 600, color: '#0f172a' }}>{ord.reference}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 500 }}>{ord.customer_name || 'Anonymous'}</div>
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>{ord.customer_email}</span>
                          </td>
                          <td style={{ padding: '14px 8px' }}>{ord.products?.title || 'Unknown Product'}</td>
                          <td style={{ padding: '14px 8px', textTransform: 'uppercase', fontSize: 12 }}>{ord.payment_method}</td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>
                            {new Date(ord.created_at).toLocaleDateString()} {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            {formatNaira(ord.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SALES HISTORY */}
          {activeTab === 'sales' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <select 
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                  
                  <select 
                    value={selectedProductFilter}
                    onChange={(e) => setSelectedProductFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
                  >
                    <option value="all">All Products</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: 260 }}
                />
              </div>

              <div className="responsive-table-wrapper">
                <table className="responsive-table table-dense">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Reference</th>
                      <th style={{ padding: '12px 8px' }}>Customer</th>
                      <th style={{ padding: '12px 8px' }}>Product</th>
                      <th style={{ padding: '12px 8px' }}>Status</th>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFilteredSales.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      displayFilteredSales.map((ord) => (
                        <tr key={ord.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13.5, color: '#334155' }}>
                          <td style={{ padding: '14px 8px', fontWeight: 600, color: '#0f172a' }}>{ord.reference}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 500 }}>{ord.customer_name || 'Anonymous'}</div>
                            <span style={{ fontSize: 11.5, color: '#64748b' }}>{ord.customer_email}</span>
                          </td>
                          <td style={{ padding: '14px 8px' }}>{ord.products?.title || 'Unknown Product'}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <span style={{ 
                              background: ord.status === 'paid' ? '#ecfdf5' : (ord.status === 'pending' ? '#fffbeb' : '#f1f5f9'), 
                              border: ord.status === 'paid' ? '1px solid #a7f3d0' : (ord.status === 'pending' ? '1px solid #fef3c7' : '1px solid #cbd5e1'), 
                              color: ord.status === 'paid' ? '#065f46' : (ord.status === 'pending' ? '#b45309' : '#475569'),
                              padding: '4px 8px', 
                              borderRadius: 6, 
                              fontSize: 11.5,
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {ord.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>
                            {new Date(ord.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            {formatNaira(ord.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STUDENTS PROFILES */}
          {activeTab === 'students' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Students Registered Profiles</h3>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', fontSize: 13, width: 260 }}
                />
              </div>

              <div className="responsive-table-wrapper">
                <table className="responsive-table" style={{ minWidth: 850 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Student Info</th>
                      <th style={{ padding: '12px 8px' }}>Role</th>
                      <th style={{ padding: '12px 8px' }}>Courses Enrolled</th>
                      <th style={{ padding: '12px 8px' }}>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFilteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: 14 }}>
                          No profiles found.
                        </td>
                      </tr>
                    ) : (
                      displayFilteredStudents.map((st) => (
                        <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13.5, color: '#334155' }}>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {st.avatar_url ? (
                                <img src={st.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#475569' }}>
                                  {st.full_name ? st.full_name[0].toUpperCase() : 'S'}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{st.full_name || 'Student Account'}</div>
                                <span style={{ fontSize: 11.5, color: '#64748b' }}>{st.email}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 8px', textTransform: 'uppercase', fontSize: 11.5, fontWeight: 600 }}>{st.role || 'user'}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ fontWeight: 600 }}>{st.coursesCount} courses</div>
                            <span style={{ fontSize: 11.5, color: '#64748b', display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={st.coursesList}>
                              {st.coursesList || 'None'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', color: '#64748b' }}>
                            {new Date(st.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PRODUCTS PERFORMANCE */}
          {activeTab === 'products' && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700 }}>Products Performance Matrix</h3>
              
              <div className="responsive-table-wrapper">
                <table className="responsive-table table-dense">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', fontSize: 13, color: '#64748b' }}>
                      <th style={{ padding: '12px 8px' }}>Product Title</th>
                      <th style={{ padding: '12px 8px' }}>Type</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Detail Views</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Copies Sold</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>Lander-to-Sales %</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productPerformance.map((prod) => (
                      <tr key={prod.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: 13.5, color: '#334155' }}>
                        <td style={{ padding: '14px 8px', fontWeight: 600, color: '#0f172a' }}>{prod.title}</td>
                        <td style={{ padding: '14px 8px', textTransform: 'capitalize', fontSize: 12.5 }}>{prod.type}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>{prod.views}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 600 }}>{prod.copiesSold}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>
                          {prod.conversion}%
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                          {formatNaira(prod.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
