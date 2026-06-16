import { useState, useEffect } from 'react'
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
      question: 'What is Amplified Skills and how does it work?',
      answer: 'Amplified Skills is Precious\' personal solo creator training platform where you can purchase premium blueprints, worksheets, and courses designed to level up your engineering and digital sales capabilities. All materials are instantly unlocked in your student dashboard upon purchase.'
    },
    {
      category: 'Payments',
      question: 'What payment methods do you support?',
      answer: 'We process all payments securely via Paystack. You can pay via credit/debit card (Visa, Mastercard, Verve), bank transfer, or USSD code depending on your bank. All digital delivery occurs instantly upon Paystack payment confirmation.'
    },
    {
      category: 'Courses',
      question: 'How do I access my course lessons and blueprints?',
      answer: 'After a successful payment, simply log into the platform using the email address you purchased with. Your enrolled courses will be listed under the "My Learning" tab on your student dashboard. Click "Start Course" or "Continue Learning" to enter the player.'
    },
    {
      category: 'Certificates',
      question: 'How do I earn and verify my completion certificate?',
      answer: 'When your lesson progress reaches 100% (marking all lessons, quizzes, and modules as completed), the system automatically issues a unique, signed certificate of completion. You can view, download a PDF version, or retrieve a public verification link directly from the "Certificates" tab in your dashboard.'
    },
    {
      category: 'Q&A',
      question: 'Can I ask questions if I get stuck on a curriculum lesson?',
      answer: 'Yes! Inside the course player, there is a dedicated "Q&A" sidebar. You can ask questions directly under any lesson. Precious (the instructor) will review student questions and reply directly in the thread. You will receive an in-app notification when an answer is posted.'
    },
    {
      category: 'Coupons',
      question: 'How do I apply a discount coupon code?',
      answer: 'During the checkout/payment page, enter your promo coupon code (e.g. AMPLIFIED50) in the promo box and click apply. The checkout price will update dynamically to reflect the discount before you initiate the Paystack payment portal.'
    },
    {
      category: 'Refunds',
      question: 'What is your refund policy?',
      answer: 'Since digital courses, ebooks, and blueprints are intangible items delivered instantly upon payment confirmation, all sales are final. Please review our Refund Policy page for more details, or contact support if you encounter technical access issues.'
    }
  ]

  const categories = ['All', 'General', 'Payments', 'Courses', 'Certificates', 'Q&A', 'Refunds']

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
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#334155', fontFamily: "'Outfit', 'Inter', sans-serif", padding: '120px 20px 80px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <span style={{ 
            background: 'rgba(37, 99, 235, 0.06)', 
            color: '#2563eb', 
            padding: '6px 16px', 
            borderRadius: 50, 
            fontSize: 12, 
            fontWeight: 700, 
            letterSpacing: '1px', 
            textTransform: 'uppercase', 
            display: 'inline-block',
            marginBottom: 20,
            border: '1px solid rgba(37, 99, 235, 0.15)'
          }}>
            Help Center & FAQs
          </span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', fontWeight: 850, letterSpacing: '-1.2px', color: '#0f172a', margin: '0 0 16px', lineHeight: 1.2 }}>
            Frequently Asked <span style={{ color: '#2563eb' }}>Questions</span>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>
            Quick solutions, onboarding guides, and common answers regarding student enrollment and course playback.
          </p>

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 500, margin: '0 auto 30px' }}>
            <input 
              type="text"
              placeholder="Search help topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 16px 14px 48px',
                fontSize: 14.5,
                color: '#0f172a',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#2563eb'
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.boxShadow = 'none'
              }}
            />
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#64748b" 
              strokeWidth="2.5" 
              width="16"
              height="16"
              style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat)
                  setOpenIndex(null)
                }}
                style={{
                  background: activeCategory === cat ? '#2563eb' : '#ffffff',
                  border: activeCategory === cat ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  padding: '7px 16px',
                  borderRadius: 50,
                  fontSize: 12.5,
                  fontWeight: activeCategory === cat ? '700' : '600',
                  color: activeCategory === cat ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
                }}
                onMouseEnter={e => {
                  if (activeCategory !== cat) {
                    e.target.style.borderColor = '#cbd5e1'
                    e.target.style.color = '#0f172a'
                  }
                }}
                onMouseLeave={e => {
                  if (activeCategory !== cat) {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.color = '#64748b'
                  }
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 60 }}>
          {filteredFaqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🔍</span>
              <p style={{ color: '#64748b', margin: 0 }}>No help items match your search. Try different keywords.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <div 
                  key={idx}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    boxShadow: isOpen ? '0 4px 20px rgba(0, 0, 0, 0.04)' : '0 1px 3px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#0f172a',
                      fontSize: 16,
                      fontWeight: 700,
                      gap: 16
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{
                      color: isOpen ? '#2563eb' : '#64748b',
                      fontSize: 20,
                      fontWeight: '300',
                      transition: 'transform 0.25s ease',
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      display: 'inline-block',
                      lineHeight: 1
                    }}>
                      +
                    </span>
                  </button>

                  <div style={{
                    maxHeight: isOpen ? 250 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: '#f8fafc'
                  }}>
                    <div style={{ padding: '0 24px 20px', color: '#475569', fontSize: 14.5, lineHeight: 1.7, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Contact Banner */}
        <div style={{ 
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
          border: '1px solid rgba(37, 99, 235, 0.1)', 
          borderRadius: 16, 
          padding: '40px', 
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(37, 99, 235, 0.15)'
        }}>
          <h3 style={{ fontSize: 20, color: '#ffffff', fontWeight: 800, margin: '0 0 10px' }}>Still need assistance?</h3>
          <p style={{ color: '#bfdbfe', fontSize: 14.5, margin: '0 0 24px', lineHeight: 1.6, maxWidth: 500, marginInline: 'auto' }}>
            Precious is always available to assist. Drop a line directly and we will get back to you within 24 hours.
          </p>
          <Link 
            to="/contact" 
            style={{ 
              background: '#ffffff', 
              color: '#1e40af', 
              padding: '12px 28px', 
              borderRadius: 8, 
              fontWeight: 700, 
              fontSize: 14.5, 
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.backgroundColor = '#f8fafc'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.backgroundColor = '#ffffff'
            }}
          >
            Contact Precious
          </Link>
        </div>

      </div>
    </div>
  )
}
