import React from 'react'
import { Link } from 'react-router-dom'

export default function GalleryPage() {
  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Visual Showcase
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Processing & Sourcing Gallery
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            Take a look inside our agribusiness supply chain: from harvesting on cooperative farms to manual selection and packaging at our export warehouse.
          </p>
        </div>
      </section>

      {/* Grid of gallery assets */}
      <section style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }} className="gallery-grid">
          {[
            { title: 'Farm Sourcing', desc: 'Working directly with cocoa and nut farmers in southern/eastern Nigeria.' },
            { title: 'Manual Sorting', desc: 'Sorting and quality control at our central warehouse facility.' },
            { title: 'Shea Butter Processing', desc: 'Sieving and packing unrefined shea butter into food-grade drums.' },
            { title: 'Bitter Kola Selections', desc: 'Selecting export-grade Garcinia kola nuts with moisture check.' },
            { title: 'Export Packaging', desc: 'Polypropylene bags lined for ocean transit protection.' },
            { title: 'Shipping Logistics', desc: 'Customs inspections and container sealing at Apapa Port.' }
          ].map((item, idx) => (
            <div key={idx} style={{
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)',
              transition: 'transform 0.25s ease'
            }} className="gallery-card">
              <div style={{ height: '240px', overflow: 'hidden', background: '#f8fafc' }}>
                <img 
                  src="/mifas_hero_image.png" 
                  alt={item.title} 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    // Shift objectPosition slightly for each to simulate different images from the collage
                    objectPosition: idx === 0 ? 'left' : idx === 1 ? 'center' : idx === 2 ? 'right' : idx === 3 ? 'top' : idx === 4 ? 'bottom' : 'center'
                  }} 
                />
              </div>
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0d2e1a', margin: '0 0 6px' }}>{item.title}</h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quote call to action */}
      <section style={{ padding: '80px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '28px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Partner with MIFAS FARMS</h2>
          <p style={{ fontSize: '15px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
            Ready to secure a premium shipment? Send us your specification requirements and we'll reply with options.
          </p>
          <Link to="/contact" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '4px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            Get a Quote Now
          </Link>
        </div>
      </section>

      <style>{`
        .gallery-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px rgba(0,0,0,0.05) !important;
        }
        @media (max-width: 992px) {
          .gallery-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 576px) {
          .gallery-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  )
}
