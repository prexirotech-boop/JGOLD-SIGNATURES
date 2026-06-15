import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) setError(error.message)
    else setMessage('Check your email for the password reset link.')
    
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--g50)', padding: 20 }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 'var(--r-xl)', boxShadow: 'var(--sh)', maxWidth: 400, width: '100%' }}>
        <h1 className="h3 t-center" style={{ marginBottom: 10 }}>Reset Password</h1>
        <p className="t-center" style={{ color: 'var(--n500)', marginBottom: 30, fontSize: '.9rem' }}>Enter your email to receive a reset link.</p>
        
        {error && <div style={{ background: 'var(--red-l)', color: 'var(--red)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: '.85rem' }}>{error}</div>}
        {message && <div style={{ background: 'var(--green-l)', color: 'var(--green)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: '.85rem' }}>{message}</div>}
        
        <form onSubmit={handleReset}>
          <div className="f-group">
            <label className="f-label">Email Address</label>
            <input className="f-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-cta" disabled={loading} style={{ width: '100%', padding: '14px' }}>
            <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
          </button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
            <a href="/login" style={{ color: 'var(--g700)', fontSize: '.85rem', fontWeight: 600 }}>Back to Login</a>
        </div>
      </div>
    </div>
  )
}
