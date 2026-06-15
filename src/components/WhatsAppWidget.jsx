import { useState, useEffect } from 'react'

const WA_NUMBER = '2347041418304'

export default function WhatsAppWidget() {
  const [visible, setVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [pulse, setPulse] = useState(true)

  // Slide in after 2 seconds
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 2000)
    // Stop pulse after 8s
    const p = setTimeout(() => setPulse(false), 8000)
    return () => { clearTimeout(t); clearTimeout(p) }
  }, [])

  const handleSendMessage = (e) => {
    e.preventDefault()
    const cleanMsg = message.trim()
    const defaultMsg = "Hi! I have a question about Amplified Skills."
    const finalMsg = cleanMsg ? encodeURIComponent(cleanMsg) : encodeURIComponent(defaultMsg)
    const url = `https://wa.me/${WA_NUMBER}?text=${finalMsg}`
    window.open(url, '_blank')
    setMessage('')
    setIsOpen(false)
  }

  return (
    <>
      {/* Chat Popup Widget */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          right: 28,
          width: 350,
          maxWidth: 'calc(100vw - 56px)',
          height: 400,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(5,11,20,0.18), 0 2px 12px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          fontFamily: "var(--font)",
          overflow: 'hidden',
          border: '1.5px solid var(--n200)',
          animation: 'widgetFadeIn 0.25s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--g900), var(--g800))',
            color: '#fff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Favicon Avatar */}
              <div style={{ position: 'relative', width: 44, height: 44 }}>
                <img 
                  src="/favicon.png" 
                  alt="Amplified Skills" 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    background: '#fff',
                    objectFit: 'contain',
                    padding: 4,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                  onError={e => {
                    // Fallback in case favicon doesn't load/exist
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  display: 'none',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--gold)',
                  color: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.2rem'
                }}>AS</div>
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#22c55e',
                  border: '2px solid var(--g900)'
                }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#fff' }}>Amplified Support</h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Online (Replies instantly)
                </p>
              </div>
            </div>
            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'opacity 0.2s',
                padding: '4px 8px'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
            >
              ×
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            background: '#f8fafc',
            backgroundImage: 'radial-gradient(#cbd5e1 0.75px, #f8fafc 0.75px)',
            backgroundSize: '15px 15px',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflowY: 'auto'
          }}>
            {/* Greeting Bubble */}
            <div style={{
              background: '#fff',
              border: '1px solid var(--n200)',
              borderRadius: '0px 14px 14px 14px',
              padding: '12px 16px',
              maxWidth: '85%',
              alignSelf: 'flex-start',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--n800)', lineHeight: 1.5 }}>
                Hi there! 👋 Welcome to Amplified Skills.
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--n800)', lineHeight: 1.5 }}>
                How can we help you build your digital skills or resolve course payments today?
              </p>
              <span style={{ display: 'block', textAlign: 'right', fontSize: '0.7rem', color: 'var(--n400)', marginTop: 6 }}>
                Just now
              </span>
            </div>
          </div>

          {/* Input/Footer Area */}
          <form 
            onSubmit={handleSendMessage}
            style={{
              padding: 12,
              background: '#fff',
              borderTop: '1px solid var(--n200)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <input 
              type="text" 
              placeholder="Type your question..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{
                flex: 1,
                border: '1.5px solid var(--n200)',
                borderRadius: 24,
                padding: '10px 16px',
                fontSize: '0.86rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--g500)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--n200)'}
            />
            <button 
              type="submit"
              style={{
                background: 'linear-gradient(135deg, var(--g600), var(--g500))',
                border: 'none',
                color: '#fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                transition: 'transform 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Send Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setPulse(false) }}
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--g600), var(--g500))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,99,235,0.45), 0 2px 8px rgba(0,0,0,0.18)',
          zIndex: 9998,
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: visible ? 'scale(1)' : 'scale(0)',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1.05)'}
      >
        {isOpen ? (
          // Close symbol
          <span style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 600 }}>×</span>
        ) : (
          // WhatsApp SVG icon
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 2C8.268 2 2 8.268 2 16c0 2.47.671 4.783 1.837 6.773L2 30l7.447-1.796A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
              fill="#fff"
            />
            <path
              d="M16 4.5C9.596 4.5 4.5 9.596 4.5 16c0 2.24.628 4.333 1.72 6.117l.282.47-1.09 3.97 4.086-1.072.453.265A11.456 11.456 0 0016 27.5c6.404 0 11.5-5.096 11.5-11.5S22.404 4.5 16 4.5z"
              fill="var(--g500)"
            />
            <path
              d="M12.572 10.5c-.322 0-.657.008-.946.644-.29.635-1.11 2.72-1.11 3.329 0 .608.32 1.215.64 1.62.322.406 1.736 2.694 4.26 3.683 2.105.821 2.525.658 2.98.616.453-.04 1.463-.598 1.67-1.175.208-.578.208-1.073.145-1.175-.06-.1-.225-.16-.474-.28-.25-.12-1.463-.722-1.69-.804-.225-.08-.388-.12-.552.12-.163.24-.633.804-.775.968-.143.162-.288.182-.537.06-.25-.12-1.054-.39-2.008-1.24-.742-.663-1.244-1.481-1.39-1.73-.147-.25-.016-.385.108-.51.112-.112.25-.29.375-.436.124-.145.165-.25.248-.414.08-.163.04-.307-.02-.43-.06-.12-.542-1.326-.75-1.812-.19-.455-.39-.395-.552-.402-.143-.007-.307-.009-.47-.009z"
              fill="#fff"
            />
          </svg>
        )}

        {/* Pulse ring */}
        {pulse && !isOpen && (
          <span style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid rgba(37,99,235,0.5)',
            animation: 'waPulse 1.6s ease-out infinite',
            pointerEvents: 'none'
          }} />
        )}
      </button>

      <style>{`
        @keyframes waPulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes widgetFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
