import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [paidRef, setPaidRef] = useState(null)

  useEffect(() => {
    const customer = localStorage.getItem('paid_customer')
    if (customer) {
      try {
        const parsed = JSON.parse(customer)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.name) setFullName(parsed.name)
        if (parsed.ref) setPaidRef(parsed.ref)
      } catch(e) {}
    }
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    if (!email) return setError("Email is required. Please return to the checkout page if you haven't paid.")
    if (!fullName) return setError("Please enter your full name.")
    if (password.length < 6) return setError("Password must be at least 6 characters.")

    setLoading(true)
    setError(null)

    try {
      // 1. Create the Supabase auth account
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() }
        }
      })

      if (signUpError) {
        if (signUpError.message.toLowerCase().includes('already registered') || signUpError.message.toLowerCase().includes('already exists')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
          if (signInError) {
            setError('An account with this email already exists. Please verify your password and try again.')
            setLoading(false)
            return
          }
        } else {
          setError(signUpError.message)
          setLoading(false)
          return
        }
      }

      // 2. Wait briefly for the profile trigger to fire in Supabase
      await new Promise(r => setTimeout(r, 1500))

      // 3. Look up the profile that was just created
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      if (profileData?.id) {
        // 4. Find the correct course to enroll in
        let courseId = null

        // Priority 1: direct product ID saved by saveOrder when profile wasn't ready
        const pendingProductId = localStorage.getItem('pending_enrollment_product')
        if (pendingProductId) {
          courseId = pendingProductId
        }

        // Priority 2: look up by Paystack reference stored at time of purchase
        if (!courseId && paidRef) {
          const { data: orderData } = await supabase
            .from('orders')
            .select('product_id, products(id, type)')
            .eq('reference', paidRef)
            .maybeSingle()

          if (orderData?.products?.type === 'course') {
            courseId = orderData.product_id
          }
        }

        // Priority 3: most recent paid course order for this email
        if (!courseId) {
          const { data: pendingOrderData } = await supabase
            .from('orders')
            .select('product_id, products(id, type)')
            .eq('customer_email', email.trim().toLowerCase())
            .eq('status', 'paid')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (pendingOrderData?.products?.type === 'course') {
            courseId = pendingOrderData.product_id
          }
        }

        // Priority 4: fallback to the most recently published course
        if (!courseId) {
          const { data: latestCourse } = await supabase
            .from('products')
            .select('id')
            .eq('type', 'course')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          courseId = latestCourse?.id || null
        }

        if (courseId) {
          // Check if enrollment already exists (saveOrder may have created it)
          const { data: existingEnr } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', profileData.id)
            .eq('course_id', courseId)
            .maybeSingle()

          if (!existingEnr) {
            const { error: enrErr } = await supabase.from('enrollments').insert({
              user_id: profileData.id,
              course_id: courseId,
              progress: []
            })
            if (enrErr) console.error('Enrollment error:', enrErr)
            else console.log('✅ Enrollment created via SetPasswordPage for course', courseId)
          } else {
            console.log('Enrollment already exists — skipping duplicate')
          }
        }
      }

      localStorage.removeItem('pending_enrollment_email')
      localStorage.removeItem('pending_enrollment_product')

      // 5. Auto-sign in so the user doesn't have to log in again after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        console.warn('Auto sign-in after signup failed:', signInError.message)
      }

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 1500)

    } catch (err) {
      console.error('Account setup error:', err)
      setError('Something went wrong. Please try again or contact support.')
      setLoading(false)
    }
  }

  const emailIsLocked = !!(localStorage.getItem('paid_customer') && JSON.parse(localStorage.getItem('paid_customer') || '{}').email)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', padding: 20, fontFamily: "var(--font)" }}>
      <div style={{ background: '#111', padding: '50px 40px', borderRadius: 24, border: '1px solid #333', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxWidth: 450, width: '100%' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(110,231,160,0.1)', border: '1px solid rgba(110,231,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
            &#10003;
          </div>
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 12 }}>Payment Successful!</h1>
        <p style={{ color: '#aaa', textAlign: 'center', marginBottom: 32, fontSize: '.95rem', lineHeight: 1.6 }}>
          Create your account below to get instant access to your courses.
        </p>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#FCA5A5', padding: 16, borderRadius: 12, marginBottom: 24, fontSize: '.9rem', textAlign: 'center', lineHeight: 1.5 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: 'rgba(60,179,113,0.1)', border: '1px solid rgba(60,179,113,0.3)', color: '#6EE7A0', padding: 16, borderRadius: 12, marginBottom: 24, fontSize: '.9rem', textAlign: 'center' }}>
            Account created! Redirecting to your dashboard...
          </div>
        )}

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={emailIsLocked}
              placeholder="e.g. chioma@gmail.com"
              style={{ width: '100%', padding: '14px 16px', background: emailIsLocked ? '#1a1a1a' : '#0a0a0a', border: '1px solid #333', borderRadius: 12, color: emailIsLocked ? '#888' : '#fff', fontSize: '1rem', boxSizing: 'border-box', cursor: emailIsLocked ? 'not-allowed' : 'auto' }}
            />
            <p style={{ fontSize: '.75rem', color: '#555', marginTop: 6 }}>Use the exact email address you used during purchase.</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              placeholder="e.g. Chioma Adeyemi"
              style={{ width: '100%', padding: '14px 16px', background: '#0a0a0a', border: '1px solid #333', borderRadius: 12, color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color .2s', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#f0a500'}
              onBlur={e => e.target.style.borderColor = '#333'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#ccc', marginBottom: 8 }}>Create Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                style={{ width: '100%', padding: '14px 44px 14px 16px', background: '#0a0a0a', border: '1px solid #333', borderRadius: 12, color: '#fff', fontSize: '1rem', outline: 'none', transition: 'border-color .2s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#f0a500'}
                onBlur={e => e.target.style.borderColor = '#333'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                  padding: 0, display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{ width: '100%', padding: '16px', background: 'linear-gradient(to right, #f0a500, #ffb700)', color: '#000', border: 'none', borderRadius: 12, fontSize: '1.05rem', fontWeight: 800, cursor: (loading || success) ? 'not-allowed' : 'pointer', opacity: (loading || success) ? 0.7 : 1, marginTop: 8 }}
          >
            {loading ? 'Creating Account...' : 'Complete Setup & Access Courses'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: '.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#f0a500', textDecoration: 'none', fontWeight: 600 }}>Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
