import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/UserMenu'
import UserAvatar from '../components/UserAvatar'

export default function AccountPage() {
  const { user, profile, loading } = useAuth()
  const [orders, setOrders] = useState([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.email) return
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user.email)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setOrders(data)
      }
      setFetching(false)
    }
    fetchOrders()
  }, [user])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#050b14', color: '#fff',
        fontFamily: "var(--font)", zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: 160, height: 160, background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0) 70%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', filter: 'blur(24px)', animation: 'ambient-glow 3s ease-in-out infinite' }} />
          <img src="/logo.png" alt="Amplified Skills" style={{ height: 64, width: 'auto', maxWidth: 220, objectFit: 'contain', marginBottom: 36, filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.15))', animation: 'logo-pulse 2.2s ease-in-out infinite' }} />
          <div className="premium-spinner" />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: '14px', letterSpacing: '0.5px', position: 'relative', zIndex: 1 }}>Loading Account...</p>
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
  if (!user) return <Navigate to="/login" />

  const ownsEbook = orders.some(o => o.product.toLowerCase().includes('ebook') || o.amount === 250000 || o.amount === 2500)
  const ownsCourse = profile?.has_access || orders.some(o => o.product.toLowerCase().includes('course') || o.product.toLowerCase().includes('blueprint'))

  return (
    <div className="std-layout">
      
      {/* Top Navbar */}
      <nav className="std-nav">
        <div className="std-nav-left">
          <Link to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="std-brand-logo">AS</div>
            <span className="std-brand-name" style={{ color: '#1c1d1f' }}>Amplified Skills</span>
          </Link>
        </div>
        <div className="std-nav-right">
          <Link to="/dashboard" className="std-nav-link">My Learning</Link>
          <UserMenu user={user} />
        </div>
      </nav>

      <main className="std-account-main">
        <div className="std-account-container">
          
          <aside className="std-account-sidebar">
            <div className="std-sidebar-avatar">
              <UserAvatar user={user} size={100} />
              <h3>{user.user_metadata?.full_name || 'Student'}</h3>
            </div>
            <nav className="std-sidebar-nav">
              <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Profile</button>
              <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>Payment history</button>
              <button className={activeTab === 'assets' ? 'active' : ''} onClick={() => setActiveTab('assets')}>Downloads & Assets</button>
            </nav>
          </aside>

          <section className="std-account-content">
            {activeTab === 'profile' && (
              <div className="std-tab-pane fade-in">
                <h2>Public profile</h2>
                <p className="std-tab-desc">Add information about yourself</p>
                
                <form className="std-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="std-form-group">
                    <label>Full Name</label>
                    <input type="text" className="std-input" defaultValue={user.user_metadata?.full_name} readOnly disabled />
                    <span className="std-help-text">Your name cannot be changed at this time.</span>
                  </div>
                  <div className="std-form-group">
                    <label>Email Address</label>
                    <input type="email" className="std-input" defaultValue={user.email} readOnly disabled />
                  </div>
                  <button type="button" className="std-btn std-btn-primary" disabled>Save</button>
                </form>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="std-tab-pane fade-in">
                <h2>Payment history</h2>
                <p className="std-tab-desc">View your previous purchases and receipts.</p>
                
                <div className="std-table-container">
                  {fetching ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#6a6f73' }}>Loading records...</div>
                  ) : orders.length > 0 ? (
                    <table className="std-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Product</th>
                          <th>Amount</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id}>
                            <td>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td>{order.product}</td>
                            <td>₦{(order.amount / (order.amount > 100000 ? 100 : 1)).toLocaleString()}</td>
                            <td>
                              <a href="#" onClick={(e) => { e.preventDefault(); alert('Receipt unavailable in beta.') }} className="std-link">Receipt</a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="std-empty-state">
                      No payment history found for this email.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="std-tab-pane fade-in">
                <h2>Downloads & Assets</h2>
                <p className="std-tab-desc">Access digital files included with your purchases.</p>
                
                <div className="std-assets-list">
                  {ownsEbook ? (
                    <div className="std-asset-card">
                      <div className="std-asset-icon">📄</div>
                      <div className="std-asset-info">
                        <h4>The N50k Blueprint (E-book)</h4>
                        <p>PDF Document & Bonus Assets</p>
                      </div>
                      <button className="std-btn std-btn-secondary" onClick={() => alert('Download starting...')}>Download</button>
                    </div>
                  ) : null}

                  {ownsCourse ? (
                    <div className="std-asset-card">
                      <div className="std-asset-icon">💼</div>
                      <div className="std-asset-info">
                        <h4>Client Documents Portal</h4>
                        <p>Proposals, Invoices & Contracts</p>
                      </div>
                      <Link to="/dashboard" className="std-btn std-btn-secondary">Access Portal</Link>
                    </div>
                  ) : null}

                  {!ownsEbook && !ownsCourse && (
                    <div className="std-empty-state">
                      No digital assets available.
                    </div>
                  )}
                </div>
              </div>
            )}

          </section>

        </div>
      </main>

    </div>
  )
}
