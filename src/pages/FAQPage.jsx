import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)
  
  // Persistent Search State
  const [search, setSearch] = useState(() => {
    return localStorage.getItem('faq_search_query') || ''
  })
  
  // Persistent Category State
  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem('faq_active_category') || 'All'
  })

  useEffect(() => {
    localStorage.setItem('faq_search_query', search)
  }, [search])

  useEffect(() => {
    localStorage.setItem('faq_active_category', activeCategory)
  }, [activeCategory])

  const faqData = [
    {
      category: 'General',
      question: 'What is MIFAS FARMS and how does it work?',
      answer: 'MIFAS FARMS LTD is a premium Nigerian agribusiness and export enterprise. We source organic crops (Bitter Kola, Kolanuts, Palm Oil, Shea Butter) directly from farming cooperatives and distribute them to local retail buyers and global wholesale importers.'
    },
    {
      category: 'Payments',
      question: 'What payment methods do you support?',
      answer: 'We support credit/debit card payments, USSD, and instant transfers through Secure Paystack. We also offer direct bank transfers; you just need to upload a screenshot of your transfer receipt during checkout for our manual admin review.'
    },
    {
      category: 'Products',
      question: 'Where are your commodities sourced from?',
      answer: 'All agricultural products are sourced directly from partner farms in agricultural regions in Nigeria. They are sorted, dried, and packaged at our Enugu facility to prevent contamination and safeguard standard quality.'
    },
    {
      category: 'Shipping',
      question: 'Do you offer international container shipping?',
      answer: 'Yes! We export globally in container load batches under FOB (Free On Board) or CIF (Cost, Insurance, and Freight) shipping terms, coordinating with leading cargo ocean liners.'
    },
    {
      category: 'Quality',
      question: 'Do you provide phytosanitary and lab certificates?',
      answer: 'Absolutely. Every wholesale shipment includes a Phytosanitary Certificate issued by the Nigerian Agricultural Quarantine Service (NAQS), plus moisture and contamination test reports from accredited laboratory analysts.'
    }
  ]

  const categories = ['All', 'General', 'Payments', 'Products', 'Shipping', 'Quality']

  const filteredFaqs = faqData.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
    
    const matchesCategory = 
      activeCategory === 'All' || 
      faq.category.toLowerCase() === activeCategory.toLowerCase()
    
    return matchesSearch && matchesCategory
  })

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div style={{ background: '#ffffff', fontFamily: 'var(--font)', color: '#1e293b' }}>
      
      {/* Page Hero Header */}
      <section style={{ background: 'linear-gradient(135deg, #0d2e1a 0%, #0a2214 100%)', color: '#ffffff', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#a3e2bb', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Help Center
          </span>
          <h1 style={{ fontSize: '40px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ fontSize: '16px', color: '#d1f4df', lineHeight: '1.6', margin: 0 }}>
            Find quick answers about commodity standards, billing methods, quarantine clearance, and shipping options.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section style={{ padding: '48px 24px 24px', maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Search Input */}
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search FAQs (e.g. moisture, shipping, paystack)..."
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {/* Categories Tab Row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} className="categories-row">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '50px',
                  border: '1.5px solid',
                  borderColor: activeCategory === cat ? 'var(--brand-primary)' : '#cbd5e1',
                  background: activeCategory === cat ? 'var(--brand-primary)' : 'transparent',
                  color: activeCategory === cat ? '#ffffff' : '#64748b',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* FAQs List Accordion */}
      <section style={{ padding: '24px 24px 80px', maxWidth: '840px', margin: '0 auto' }}>
        {filteredFaqs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredFaqs.map((faq, idx) => (
              <div 
                key={idx} 
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  overflow: 'hidden'
                }}
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <strong style={{ fontSize: '16px', color: '#0d2e1a' }}>{faq.question}</strong>
                  <span style={{ fontSize: '18px', color: 'var(--brand-primary)', fontWeight: 800 }}>
                    {openIndex === idx ? '−' : '+'}
                  </span>
                </button>
                
                {openIndex === idx && (
                  <div style={{
                    padding: '0 24px 20px',
                    fontSize: '14.5px',
                    lineHeight: '1.65',
                    color: '#475569',
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '16px'
                  }}>
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
            No questions found matching your search.
          </div>
        )}
      </section>

      {/* Call to action */}
      <section style={{ padding: '60px 24px', background: '#f8fafc', textAlign: 'center', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#0d2e1a', fontWeight: 800, margin: 0 }}>Still have questions?</h2>
          <p style={{ fontSize: '14.5px', color: '#64748b', margin: 0 }}>
            If you need assistance with bulk cargo quotes or shipping schedules, please contact our helpdesk.
          </p>
          <Link to="/contact" style={{
            background: 'var(--brand-primary)',
            color: '#ffffff',
            padding: '11px 24px',
            borderRadius: '6px',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '13.5px',
            transition: 'background-color 0.2s'
          }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--brand-hover)'}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--brand-primary)'}>
            Contact Support
          </Link>
        </div>
      </section>

    </div>
  )
}
