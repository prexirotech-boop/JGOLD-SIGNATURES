import { Link } from 'react-router-dom'

export default function AboutPage() {
  return (
    <div className="page-layout">
      
      {/* Hero */}
      <section className="page-hero">
        <div className="page-container text-center">
          <span className="page-badge">Who We Are</span>
          <h1>Our Mission & Values</h1>
          <p className="page-subtitle">
            Amplified Skills is a premier business education academy dedicated to unlocking financial freedom for ambitious individuals through premium digital skill mastery.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="page-section">
        <div className="page-container" style={{ maxWidth: '800px' }}>
          
          <div className="about-card" style={{ marginBottom: '40px' }}>
            <h2>The Story of Amplified Skills</h2>
            <p>
              Founded by entrepreneur and strategist <strong>Nnanta Precious</strong>, Amplified Skills was born out of a crucial frustration: the alarming disconnect between formal education and real-world income generation. 
            </p>
            <p>
              Every year, millions of graduates exit academic institutions with degrees but zero leverage in the high-income global digital economy. We realized that what changes lives isn't a certificate—it's <strong>practical leverage, high-demand skillsets, and direct, step-by-step mentorship.</strong>
            </p>
            <p>
              We don't sell get-rich-quick schemes. We build world-class freelancers and modern service providers using the exact blueprints we used to escape the 9-to-5 grind ourselves.
            </p>
          </div>

          <h2 className="text-center" style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 24px', color: '#0f172a' }}>Our Core Pillars</h2>
          <div className="about-grid">
            {[
              { title: 'Action Over Theory', desc: 'No complex filler. We give you ready-to-use templates, checklists, and exact instructions so you can build today.' },
              { title: 'Global Skill Leverage', desc: 'We teach you the exact services local and international businesses are paying premium prices for right now.' },
              { title: 'Authentic Mentorship', desc: 'Real entrepreneurs review your work, help you solve client blocks, and guide your journey.' },
              { title: 'Financial Resilience', desc: 'We help you move from single salary dependencies to recurring digital asset portfolios.' }
            ].map((p, i) => (
              <div key={i} className="about-pillar-card">
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center" style={{ marginTop: '48px' }}>
            <Link to="/products" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '16px' }}>
              Explore Our Training Programs
            </Link>
          </div>

        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .page-layout { background: #f8fafc; min-height: 100vh; font-family: var(--font); }
        .page-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .text-center { text-align: center; }
        
        .page-hero { padding: 80px 0 40px; }
        .page-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
        .page-hero h1 { font-size: 48px; font-weight: 800; color: #0f172a; margin: 0 0 16px; letter-spacing: -1px; }
        .page-subtitle { font-size: 18px; color: #64748b; max-width: 650px; margin: 0 auto; line-height: 1.6; }
        
        .page-section { padding: 40px 0 80px; }
        
        .about-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .about-card h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.5px; }
        .about-card p { font-size: 16px; color: #475569; line-height: 1.8; margin: 0 0 16px; }
        .about-card p:last-child { margin-bottom: 0; }
        .about-card strong { color: #0f172a; }
        
        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .about-pillar-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px -2px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .about-pillar-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .about-pillar-card h3 { font-size: 18px; font-weight: 700; color: #2563eb; margin: 0 0 8px; }
        .about-pillar-card p { font-size: 15px; color: #64748b; line-height: 1.6; margin: 0; }
        
        .btn { padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; text-decoration: none; transition: all 0.2s; text-align: center; display: inline-block; }
        .btn-primary { background: #2563eb; border: 1px solid #2563eb; color: #ffffff; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
        .btn-primary:hover { background: #1d4ed8; border-color: #1d4ed8; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3); transform: translateY(-1px); }

        @media (max-width: 600px) {
          .about-grid { grid-template-columns: 1fr; }
          .page-hero h1 { font-size: 36px; }
          .about-card { padding: 24px; }
        }
      `}} />
    </div>
  )
}
