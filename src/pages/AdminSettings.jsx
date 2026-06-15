import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function AdminSettings() {
  const { user, profile, refreshProfile } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Password fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Platform styling fields
  const [brandName, setBrandName] = useState('Amplified Skills')
  const [supportEmail, setSupportEmail] = useState('support@amplifiedskills.com')

  // Payment Configuration fields
  const [paystackPublicKey, setPaystackPublicKey] = useState('')
  const [paystackSecretKey, setPaystackSecretKey] = useState('')
  const [stripePublicKey, setStripePublicKey] = useState('')
  const [stripeSecretKey, setStripeSecretKey] = useState('')
  const [resendApiKey, setResendApiKey] = useState('')

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
    }

    async function loadPlatformSettings() {
      try {
        const { data } = await supabase.from('settings').select('*')
        if (data) {
          const siteConfig = data.find(s => s.id === 'site_config')
          if (siteConfig?.value) {
            setBrandName(siteConfig.value.platform_name || 'Amplified Skills')
            setSupportEmail(siteConfig.value.support_email || 'support@amplifiedskills.com')
          }
          const payConfig = data.find(s => s.id === 'payment_config')
          if (payConfig?.value) {
            setPaystackPublicKey(payConfig.value.paystack_public_key || '')
            setPaystackSecretKey(payConfig.value.paystack_secret_key || '')
            setStripePublicKey(payConfig.value.stripe_public_key || '')
            setStripeSecretKey(payConfig.value.stripe_secret_key || '')
            setResendApiKey(payConfig.value.resend_api_key || '')
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadPlatformSettings()
  }, [profile])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // 1. Try uploading to Supabase Storage in 'avatars' bucket first
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (!uploadError && data) {
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)
        setAvatarUrl(publicUrl)
        setMessage('Avatar uploaded successfully! Click Save Profile to apply.')
      } else {
        // 2. Fallback to base64 Data URL if bucket upload is not configured or blocked
        console.warn('Storage upload failed, falling back to Base64:', uploadError?.message)
        if (file.size > 1.5 * 1024 * 1024) {
          setError('Please select an image smaller than 1.5MB for fast loading.')
          setLoading(false)
          return
        }
        const reader = new FileReader()
        reader.onloadend = () => {
          setAvatarUrl(reader.result)
          setMessage('Avatar loaded locally. Save profile to persist.')
        }
        reader.readAsDataURL(file)
      }
    } catch (err) {
      console.error(err)
      setError('Error uploading avatar. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', user.id)

      if (updateErr) throw updateErr
      if (refreshProfile) refreshProfile()
      setMessage('Profile settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlatform = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      // 1. Update site_config
      const { error: err1 } = await supabase
        .from('settings')
        .upsert({
          id: 'site_config',
          value: {
            platform_name: brandName.trim(),
            support_email: supportEmail.trim(),
            refund_days: 30
          },
          updated_at: new Date().toISOString()
        })

      // 2. Update payment_config
      const { error: err2 } = await supabase
        .from('settings')
        .upsert({
          id: 'payment_config',
          value: {
            paystack_public_key: paystackPublicKey.trim(),
            paystack_secret_key: paystackSecretKey.trim(),
            stripe_public_key: stripePublicKey.trim(),
            stripe_secret_key: stripeSecretKey.trim(),
            resend_api_key: resendApiKey.trim()
          },
          updated_at: new Date().toISOString()
        })

      if (err1) throw err1
      if (err2) throw err2

      // Save in localStorage for immediate sync in frontend header
      localStorage.setItem('brandName', brandName.trim())
      localStorage.setItem('supportEmail', supportEmail.trim())

      setMessage('Platform settings & API credentials updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const { error: pwErr } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (pwErr) throw pwErr
      setMessage('Admin credentials updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isDesktop = windowWidth >= 1024

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'var(--font)' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1f36', margin: 0 }}>Platform Settings</h2>
        <p style={{ color: '#697386', marginTop: 4, fontSize: 13.5 }}>Configure branding guidelines, payment gateway settings, and admin credentials.</p>
      </div>

      {message && <div style={{ padding: 12, background: '#e3fcef', color: '#00875a', borderRadius: 6, marginBottom: 24, fontWeight: 500, fontSize: 13, border: '1px solid #c3f2d7' }}>{message}</div>}
      {error && <div style={{ padding: 12, background: '#ffebe6', color: '#ae2a19', borderRadius: 6, marginBottom: 24, fontWeight: 500, fontSize: 13, border: '1px solid #ffd2ca' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1.8fr 1fr' : '1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Column: Form Settings Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Admin Profile Form */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1a1f36' }}>Admin Profile Settings</h3>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Profile Avatar Selection Widget */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
                <img 
                  src={avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                  alt="Avatar Preview" 
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e3e8ee' }}
                />
                <div>
                  <label 
                    htmlFor="avatar-upload"
                    style={{ 
                      display: 'inline-block',
                      background: '#fff', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: 4, 
                      padding: '6px 12px', 
                      fontSize: 12.5, 
                      fontWeight: 500,
                      color: '#4f566b',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}
                  >
                    Choose Image File
                  </label>
                  <input 
                    type="file" 
                    id="avatar-upload" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                    style={{ display: 'none' }} 
                  />
                  <div style={{ fontSize: 11, color: '#8792a2', marginTop: 4 }}>JPEG or PNG. Max 1.5MB.</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Full Name</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Avatar URL Link (Alternative)</label>
                <input 
                  type="url" 
                  value={avatarUrl.startsWith('data:') ? '' : avatarUrl} 
                  onChange={e => setAvatarUrl(e.target.value)} 
                  placeholder="https://..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Biography Info</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, minHeight: 70, outline: 'none' }}
                  placeholder="Showcase your professional bio in about segments..."
                />
              </div>

              <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Platform Identity & Gateway Settings */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1a1f36' }}>Platform Branding & API Keys</h3>
            <form onSubmit={handleUpdatePlatform} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Brand / Site Title</label>
                  <input 
                    type="text" 
                    value={brandName} 
                    onChange={e => setBrandName(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Support Contact Email</label>
                  <input 
                    type="email" 
                    value={supportEmail} 
                    onChange={e => setSupportEmail(e.target.value)} 
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paystack Credentials</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Paystack Public Key</label>
                  <input 
                    type="text" 
                    value={paystackPublicKey} 
                    onChange={e => setPaystackPublicKey(e.target.value)} 
                    placeholder="pk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Paystack Secret Key</label>
                  <input 
                    type="password" 
                    value={paystackSecretKey} 
                    onChange={e => setPaystackSecretKey(e.target.value)} 
                    placeholder="sk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stripe Credentials</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Stripe Public Key</label>
                  <input 
                    type="text" 
                    value={stripePublicKey} 
                    onChange={e => setStripePublicKey(e.target.value)} 
                    placeholder="pk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Stripe Secret Key</label>
                  <input 
                    type="password" 
                    value={stripeSecretKey} 
                    onChange={e => setStripeSecretKey(e.target.value)} 
                    placeholder="sk_live_..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', margin: '12px 0 6px 0', paddingTop: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Broadcast Mail Keys</span>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Resend API Key</label>
                <input 
                  type="password" 
                  value={resendApiKey} 
                  onChange={e => setResendApiKey(e.target.value)} 
                  placeholder="re_..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <button type="submit" style={{ alignSelf: 'flex-start', background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13.5, marginTop: 8, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                Save Configurations
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#1a1f36' }}>Security & Credentials</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6, color: '#3c4257' }}>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={loading} style={{ alignSelf: 'flex-start', background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 6, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13.5, transition: 'all 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Beautiful Live Preview Card */}
        <div>
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            borderRadius: 12, 
            padding: 24, 
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.04)',
            position: 'sticky',
            top: 24
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: 13, fontWeight: 600, color: '#1a1f36', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              Live Profile Preview
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
              <img 
                src={avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'} 
                alt="Avatar" 
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb', marginBottom: 12, boxShadow: '0 4px 10px rgba(37, 99, 235,0.15)' }} 
              />
              <h5 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1a1f36' }}>{fullName || 'Administrator Name'}</h5>
              <span style={{ fontSize: 12, color: '#697386', fontWeight: 500, marginTop: 4 }}>Platform Instructor</span>
              
              <div style={{ borderTop: '1px solid #f1f5f9', width: '100%', margin: '16px 0', paddingTop: 16 }}>
                <p style={{ margin: 0, fontSize: 12.5, color: '#4f566b', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{bio || 'A descriptive biography will be displayed here for students to learn more about your teaching profile.'}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%', marginTop: 8 }}>
                <span style={{ fontSize: 11, background: '#e3fcef', color: '#00875a', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Active</span>
                <span style={{ fontSize: 11, background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>{brandName}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
