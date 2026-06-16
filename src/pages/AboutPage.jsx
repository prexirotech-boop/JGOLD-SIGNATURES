import { Link } from 'react-router-dom'

export default function AboutPage() {
  const stats = [
    { value: '15,000+', label: 'Students Trained' },
    { value: '95%', label: 'Success Rate' },
    { value: '18+', label: 'Premium Blueprints' },
    { value: '₦350M+', label: 'Student Revenue' }
  ]

  const pillars = [
    { 
      title: 'Action Over Theory', 
      desc: 'No complex filler. We give you ready-to-use templates, checklists, and exact instructions so you can build today.',
      icon: '⚡'
    },
    { 
      title: 'Global Skill Leverage', 
      desc: 'We teach you the exact services local and international businesses are paying premium prices for right now.',
      icon: '🌍'
    },
    { 
      title: 'Authentic Mentorship', 
      desc: 'Real entrepreneurs review your work, help you solve client blocks, and guide your journey.',
      icon: '🤝'
    },
    { 
      title: 'Financial Resilience', 
      desc: 'We help you move from single salary dependencies to recurring digital asset portfolios.',
      icon: '📈'
    }
  ]

  return (
    <div className="page-layout">
      
      {/* Hero */}
      <section className="page-hero">
        <div className="page-container text-center">
          <span className="page-badge">Who We Are</span>
          <h1 className="hero-title">Empowering the Next Generation of <span className="highlight">Solo Creators</span></h1>
          <p className="page-subtitle">
            Amplified Skills is a premier business education academy dedicated to unlocking financial freedom for ambitious individuals through premium digital skill mastery.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="page-section">
        <div className="page-container" style={{ maxWidth: '900px' }}>
          
          {/* Story Card */}
          <div className="about-card" style={{ marginBottom: '48px' }}>
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

          {/* Stats Section */}
          <div className="stats-grid" style={{ marginBottom: '60px' }}>
            {stats.map((s, idx) => (
              <div key={idx} className="stat-card">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Core Pillars */}
          <h2 className="section-heading text-center">Our Core Pillars</h2>
          <div className="about-grid" style={{ marginBottom: '60px' }}>
            {pillars.map((p, i) => (
              <div key={i} className="about-pillar-card">
                <div className="pillar-icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="cta-banner text-center">
            <h3>Ready to amplify your skills?</h3>
            <p>Unlock premium blueprints and start building high-income digital capabilities today.</p>
            <Link to="/products" className="btn btn-primary">
              Explore Our Training Programs
            </Link>
          </div>

        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .page-layout { 
          background-color: #f8fafc; 
          min-height: 100vh; 
          font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
          padding-top: 40px;
        }
        .page-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .text-center { text-align: center; }
        
        .page-hero { padding: 80px 0 30px; }
        .page-badge { 
          display: inline-block; 
          background: rgba(37, 99, 235, 0.06); 
          color: #2563eb; 
          border: 1px solid rgba(37, 99, 235, 0.15);
          padding: 6px 16px; 
          border-radius: 50px; 
          font-size: 12px; 
          font-weight: 700; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          margin-bottom: 18px; 
        }
        .hero-title { 
          font-size: clamp(2.2rem, 6vw, 3.2rem); 
          font-weight: 850; 
          color: #0f172a; 
          margin: 0 0 16px; 
          letter-spacing: -1.5px; 
          line-height: 1.15;
        }
        .hero-title .highlight {
          color: #2563eb;
        }
        .page-subtitle { font-size: 18px; color: #64748b; max-width: 650px; margin: 0 auto; line-height: 1.65; }
        
        .page-section { padding: 20px 0 80px; }
        
        .about-card { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 16px; 
          padding: 40px; 
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03); 
        }
        .about-card h2 { font-size: 26px; font-weight: 800; color: #0f172a; margin: 0 0 18px; letter-spacing: -0.5px; }
        .about-card p { font-size: 16px; color: #475569; line-height: 1.8; margin: 0 0 16px; }
        .about-card p:last-child { margin-bottom: 0; }
        .about-card strong { color: #0f172a; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px 16px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.02);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
        }
        .stat-value {
          font-size: 28px;
          font-weight: 850;
          color: #2563eb;
          margin-bottom: 4px;
          letter-spacing: -0.5px;
        }
        .stat-label {
          font-size: 13.5px;
          color: #64748b;
          font-weight: 600;
        }
        
        .section-heading {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 32px;
          letter-spacing: -0.5px;
        }

        .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .about-pillar-card { 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          padding: 28px; 
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.02); 
          transition: transform 0.2s, box-shadow 0.2s; 
        }
        .about-pillar-card:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06); 
        }
        .pillar-icon {
          font-size: 32px;
          margin-bottom: 16px;
        }
        .about-pillar-card h3 { font-size: 18.5px; font-weight: 750; color: #0f172a; margin: 0 0 10px; }
        .about-pillar-card p { font-size: 15px; color: #64748b; line-height: 1.65; margin: 0; }
        
        .cta-banner {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border: 1px solid rgba(37, 99, 235, 0.1);
          border-radius: 16px;
          padding: 40px;
          color: #ffffff;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.15);
        }
        .cta-banner h3 {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 8px;
          color: #ffffff;
        }
        .cta-banner p {
          font-size: 15px;
          color: #bfdbfe;
          margin: 0 0 24px;
        }

        .btn { padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14.5px; text-decoration: none; transition: all 0.2s; text-align: center; display: inline-block; cursor: pointer; }
        .btn-primary { 
          background: #ffffff; 
          border: 1px solid #ffffff; 
          color: #1e40af; 
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05); 
        }
        .btn-primary:hover { 
          background: #f8fafc; 
          border-color: #f8fafc; 
          transform: translateY(-1px); 
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .about-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: 1fr; }
          .hero-title { font-size: 32px; }
          .about-card { padding: 24px; }
          .cta-banner { padding: 28px 20px; }
        }
      `}} />
    </div>
  )
}
