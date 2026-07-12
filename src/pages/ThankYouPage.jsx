import { useEffect } from 'react'
import { CONFIG } from '../lib/config'
import { useAuth } from '../context/AuthContext'
import UpsellWidget from '../components/UpsellWidget'

export default function ThankYouPage() {
  const { user } = useAuth()
  const customer = JSON.parse(localStorage.getItem('paid_customer') || '{}')

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  const first = (customer?.name || 'Champion').split(' ')[0]

  return (
    <>
      {/* Hero */}
      <div className="ty-hero">
        <div className="wrap t-center">
          <div className="check-circle">🎉</div>
          <h1 className="h1 t-white" style={{ marginBottom: 12 }}>
            {first}, Your Blueprint is Ready!
          </h1>
          <p style={{ color: 'rgba(255,255,255,.72)', fontSize: '1rem', maxWidth: 460, margin: '0 auto' }}>
            Payment confirmed. Your N50K Blueprint and all bonuses are ready for you right now.
          </p>
          {customer?.ref && (
            <p style={{ color: 'rgba(255,255,255,.38)', fontSize: '.76rem', marginTop: 12 }}>
              Order ref: {customer.ref}
            </p>
          )}
        </div>
      </div>

      <section className="section-sm">
        <div className="wrap-n">
          {/* Post-Purchase One-Time Offer Widget */}
          <UpsellWidget placement="thankyou" userId={user?.id} />

          {/* Download card */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-2xl)', padding: 32, textAlign: 'center', boxShadow: 'var(--sh-xl)', border: '2px solid var(--g200)', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, var(--g700), var(--gold), var(--g600))' }} />
            <div style={{ marginBottom: 10 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--g600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"></path><path d="M6 6h10M6 10h10"></path></svg>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 5 }}>The N50K Blueprint</h2>
            <p style={{ fontSize: '.88rem', color: 'var(--n500)', marginBottom: 6 }}>Complete 55-Page Guide + All 4 Bonuses</p>
            {customer?.email && (
              <p style={{ fontSize: '.82rem', color: 'var(--g600)', fontWeight: 600, background: 'var(--g50)', display: 'inline-block', padding: '4px 14px', borderRadius: 50, marginBottom: 20 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Also sent to: {customer.email}
              </p>
            )}
            <a href={CONFIG.PDF_URL} download style={{ display: 'block' }}>
              <button className="btn-download">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                <span>Download Your Blueprint Now</span>
              </button>
            </a>
          </div>

          {/* Next steps */}
          <div style={{ background: 'var(--g50)', border: '1.5px solid var(--g200)', borderRadius: 'var(--r-xl)', padding: '22px 20px', marginBottom: 16 }}>
            <p style={{ fontWeight: 800, color: 'var(--g800)', marginBottom: 12, fontSize: '.92rem' }}>Start Here — Do This Right Now:</p>
            <ol style={{ paddingLeft: 0 }}>
              {[
                'Download your Blueprint and save it to your phone',
                'Read Chapter 1 & 2 today — takes less than 30 minutes',
                'Pick your business from Chapter 3 by tomorrow',
                'Set up WhatsApp Business and post your first offer this week',
                'Tell 10 people what you\'re building — accountability starts now',
              ].map((step, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '7px 0', borderBottom: i < 4 ? '1px solid var(--g200)' : 'none', fontSize: '.9rem', color: 'var(--n700)' }}>
                  <span style={{ width: 26, height: 26, minWidth: 26, borderRadius: '50%', background: 'var(--g700)', color: '#fff', fontWeight: 800, fontSize: '.76rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Bonuses */}
          <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', padding: '22px 20px', border: '1.5px solid var(--n200)', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 12, color: 'var(--n700)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginRight: 6, verticalAlign: 'middle' }}><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
              Your Free Bonuses Are Inside the PDF:
            </p>
            <div className="grid-2" style={{ gap: 8 }}>
              {['Supplier Directory', '30 Social Captions', '100-Day Action Plan', 'Free Tools Directory'].map(b => (
                <div key={b} style={{ background: 'var(--g50)', borderRadius: 10, padding: '10px 14px', border: '1px solid var(--g100)', fontSize: '.86rem', fontWeight: 600, color: 'var(--g800)' }}>
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Share */}
          <div style={{ background: 'var(--n50)', borderRadius: 'var(--r-xl)', padding: '22px 20px', border: '1.5px solid var(--n200)', marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontWeight: 700, marginBottom: 6 }}>💚 Share — Help Another Nigerian Build</p>
            <p style={{ fontSize: '.84rem', color: 'var(--n500)', marginBottom: 14 }}>Know someone who needs this? Share the page and give them the same opportunity you just took.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'WhatsApp', bg: '#25D366', url: `https://wa.me/?text=${encodeURIComponent(`I just got the N50K Blueprint — the complete guide to starting a profitable business in Nigeria with ₦50K. You should get it too: ${window.location.origin}`)}` },
                { label: 'Facebook', bg: '#1877F2', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}` },
                { label: 'X / Twitter', bg: '#000', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just got the N50K Blueprint! Starting my business journey. You should too 👉 ${window.location.origin}`)}` },
              ].map(({ label, bg, url }) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer">
                  <button style={{ background: bg, color: '#fff', padding: '10px 18px', borderRadius: 50, fontWeight: 700, fontSize: '.83rem', border: 'none', cursor: 'pointer', transition: 'opacity .2s', opacity: .9 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = .9}
                  >{label}</button>
                </a>
              ))}
            </div>
          </div>

          {/* Guarantee reminder */}
          <div style={{ background: 'var(--gold-l)', borderRadius: 'var(--r-lg)', padding: '18px 20px', textAlign: 'center', border: '1.5px solid var(--gold)' }}>
            <p style={{ fontWeight: 700, color: 'var(--g800)', fontSize: '.9rem' }}>🔐 Your Access Is Permanent</p>
            <p style={{ fontSize: '.81rem', color: 'var(--n600)', marginTop: 5 }}>Your Blueprint is tied to your email — yours forever. Every future update is included at no extra cost.</p>
          </div>

        </div>
      </section>

    </>
  )
}
