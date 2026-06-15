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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#f3f4f6', fontFamily: 'var(--font)', padding: '120px 20px 80px' }}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <span style={{ 
            background: 'rgba(245, 197, 24, 0.1)', 
            color: 'var(--gold)', 
            padding: '6px 16px', 
            borderRadius: 50, 
            fontSize: 12, 
            fontWeight: 700, 
            letterSpacing: '1px', 
            textTransform: 'uppercase', 
            display: 'inline-block',
            marginBottom: 20,
            border: '1px solid rgba(245, 197, 24, 0.2)'
          }}>
            Help Center & FAQs
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-1.2px', color: '#fff', margin: '0 0 16px', lineHeight: 1.2 }}>
            Frequently Asked <span style={{ color: 'var(--gold)' }}>Questions</span>
          </h1>
          <p style={{ fontSize: 16, color: '#9ca3af', maxWidth: 550, margin: '0 auto 32px', lineHeight: 1.6 }}>
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
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '14px 16px 14px 48px',
                fontSize: 14.5,
                color: '#fff',
                outline: 'none',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(245, 197, 24, 0.5)'
                e.target.style.boxShadow = '0 0 20px rgba(245, 197, 24, 0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#6b7280" 
              strokeWidth="2" 
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
                  background: activeCategory === cat ? 'var(--gold)' : 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '7px 14px',
                  borderRadius: 50,
                  fontSize: 12.5,
                  fontWeight: activeCategory === cat ? '700' : '600',
                  color: activeCategory === cat ? '#000' : '#9ca3af',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  if (activeCategory !== cat) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                    e.target.style.color = '#fff'
                  }
                }}
                onMouseLeave={e => {
                  if (activeCategory !== cat) {
                    e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                    e.target.style.color = '#9ca3af'
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
            <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: 14 }}>
              <span style={{ fontSize: 32, display: 'block', marginBottom: 12 }}>🔍</span>
              <p style={{ color: '#9ca3af', margin: 0 }}>No help items match your search. Try different keywords.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <div 
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'all 0.25s ease'
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
                      color: '#fff',
                      fontSize: 15.5,
                      fontWeight: 700,
                      gap: 16
                    }}
                  >
                    <span>{faq.question}</span>
                    <span style={{
                      color: isOpen ? 'var(--gold)' : '#9ca3af',
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
                    background: 'rgba(255, 255, 255, 0.005)'
                  }}>
                    <div style={{ padding: '0 24px 20px', color: '#9ca3af', fontSize: 14.5, lineHeight: 1.7, borderTop: '1px solid rgba(255, 255, 255, 0.02)', paddingTop: 12 }}>
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
          background: 'linear-gradient(135deg, #0d3b2d 0%, #052817 100%)', 
          border: '1px solid rgba(93, 191, 133, 0.2)', 
          borderRadius: 16, 
          padding: '40px', 
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{ fontSize: 20, color: '#fff', fontWeight: 800, margin: '0 0 10px' }}>Still need assistance?</h3>
          <p style={{ color: '#a7f3d0', fontSize: 14.5, margin: '0 0 24px', lineHeight: 1.6, maxWidth: 500, marginInline: 'auto' }}>
            Precious is always available to assist. Drop a line directly and we will get back to you within 24 hours.
          </p>
          <Link 
            to="/contact" 
            style={{ 
              background: 'var(--gold)', 
              color: '#000', 
              padding: '12px 28px', 
              borderRadius: 8, 
              fontWeight: 700, 
              fontSize: 14, 
              textDecoration: 'none',
              display: 'inline-block',
              boxShadow: '0 4px 14px rgba(245, 197, 24, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            Contact Precious
          </Link>
        </div>

      </div>
    </div>
  )
}
