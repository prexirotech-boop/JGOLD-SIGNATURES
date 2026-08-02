import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ProductsPage from './pages/ProductsPage'
import EbookSalesPage from './pages/EbookSalesPage'
import SalesPage from './pages/SalesPage'
import PaymentPage from './pages/PaymentPage'
import ThankYouPage from './pages/ThankYouPage'
import ProductDetailsPage from './pages/ProductDetailsPage'

// Legal Pages
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import RefundPage from './pages/RefundPage'
import ContactPage from './pages/ContactPage'

// Components
import Footer from './components/Footer'
import Header from './components/Header'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetPasswordPage from './pages/SetPasswordPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LMSDashboard from './pages/LMSDashboard'
import LMSCourse from './pages/LMSCourse'
import AccountPage from './pages/AccountPage'
import AdminDashboard from './pages/AdminDashboard'
import BlogPage from './pages/BlogPage'
import LandingPageRenderer from './pages/LandingPageRenderer'
import FAQPage from './pages/FAQPage'
import AffiliatePage from './pages/AffiliatePage'
import QualityPage from './pages/QualityPage'
import ExportPage from './pages/ExportPage'
import GalleryPage from './pages/GalleryPage'
import WhatsAppWidget from './components/WhatsAppWidget'
import { supabase } from './lib/supabase'

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { trackEvent } from './lib/analytics'
import { getPages } from './lib/pagesScanner'
import { CONFIG } from './lib/config'

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const ROUTE_SEO = {
  '/': {
    title: 'JGOLD SIGNATURES — Premium Men\'s Luxury Shoes & Accessories',
    description: 'Welcome to JGOLD SIGNATURES, where luxury meets style. Browse our curated collection of exquisite handcrafted men\'s shoes and elegant clothing accessories.'
  },
  '/about': {
    title: 'About Us — JGOLD SIGNATURES Luxury Brand',
    description: 'Learn about JGOLD SIGNATURES, our commitment to master craftsmanship, and how we curate premium shoes and clothing accessories for modern gentlemen.'
  },
  '/products': {
    title: 'Shop Men\'s Luxury Shoes & Accessories — JGOLD SIGNATURES',
    description: 'Browse and purchase top-quality leather shoes, dress shoes, and elegant accessories directly from our luxury storefront.'
  },
  '/contact': {
    title: 'Contact Us — JGOLD SIGNATURES Customer Support',
    description: 'Get in touch with JGOLD SIGNATURES. Reach out to our Lagos styling and support team for inquiries, sizing consultation, or order assistance.'
  },
  '/blog': {
    title: 'Luxury Fashion & Styling Blog — JGOLD SIGNATURES',
    description: 'Stay updated with the latest men\'s styling advice, shoe care guides, and fashion trends from JGOLD SIGNATURES.'
  },
  '/faq': {
    title: 'Frequently Asked Questions — JGOLD SIGNATURES',
    description: 'Find answers to common questions about JGOLD SIGNATURES shoe sizing, shipping rates, payment gateways, and return policies.'
  },
  '/affiliate': {
    title: 'Affiliate Partnership Program — JGOLD SIGNATURES',
    description: 'Join the JGOLD SIGNATURES affiliate program. Earn commissions by referring customers to our luxury men\'s clothing and footwear store.'
  },
  '/quality': {
    title: 'Premium Craftsmanship & Quality Assurance — JGOLD SIGNATURES',
    description: 'JGOLD SIGNATURES operates under strict quality standards, ensuring all footwear and accessories meet international premium grade inspections.'
  },
  '/export': {
    title: 'Global Delivery & Shipping Services — JGOLD SIGNATURES',
    description: 'JGOLD SIGNATURES offers premium express shipping for our luxury products to clients globally.'
  },
  '/gallery': {
    title: 'JGOLD SIGNATURES — Product Gallery & Craftsmanship',
    description: 'Explore photos of our handcrafted leather shoes, premium apparel, and detailed design processes.'
  },
  '/terms': {
    title: 'Terms of Service — JGOLD SIGNATURES',
    description: 'Read the terms and conditions governing the use of JGOLD SIGNATURES website, ordering systems, and premium commerce services.'
  },
  '/privacy': {
    title: 'Privacy Policy — JGOLD SIGNATURES',
    description: 'Review our privacy policy to understand how JGOLD SIGNATURES handles and protects your personal and transactional information.'
  },
  '/refund': {
    title: 'Refund & Exchange Policy — JGOLD SIGNATURES',
    description: 'Understand the terms and procedures for exchanges, size replacements, and refunds at JGOLD SIGNATURES.'
  }
}

function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // If the URL has a password recovery hash parameter, redirect to the reset password form page
    if (window.location.hash && 
       (window.location.hash.includes('type=recovery') || window.location.hash.includes('access_token=')) &&
       location.pathname !== '/reset-password') {
      navigate('/reset-password' + window.location.hash)
    }
  }, [location, navigate])

  const [featureFlags, setFeatureFlags] = useState({
    enable_academics: localStorage.getItem('enable_academics') === 'true',
    enable_affiliates: localStorage.getItem('enable_affiliates') !== 'false',
    enable_payouts: localStorage.getItem('enable_payouts') !== 'false',
    enable_upsells: localStorage.getItem('enable_upsells') !== 'false',
  })

  useEffect(() => {
    async function loadFlags() {
      try {
        const { data } = await supabase.from('settings').select('*')
        if (data) {
          const siteConfig = data.find(s => s.id === 'site_config')
          if (siteConfig?.value) {
            const academics = siteConfig.value.enable_academics ?? false
            const affiliates = siteConfig.value.enable_affiliates ?? true
            const payouts = siteConfig.value.enable_payouts ?? true
            const upsells = siteConfig.value.enable_upsells ?? true

            localStorage.setItem('enable_academics', academics)
            localStorage.setItem('enable_affiliates', affiliates)
            localStorage.setItem('enable_payouts', payouts)
            localStorage.setItem('enable_upsells', upsells)

            setFeatureFlags({
              enable_academics: academics,
              enable_affiliates: affiliates,
              enable_payouts: payouts,
              enable_upsells: upsells,
            })
          }
        }
      } catch (err) {
        console.error('Error loading config flags:', err)
      }
    }
    loadFlags()
  }, [])

  // Track PageView and apply dynamic SEO Meta tags on location changes
  useEffect(() => {
    trackEvent('page_view')

    const path = location.pathname
    // Skip dynamic updates for dynamic routes like product details (handled inside page component)
    if (!path.startsWith('/product/') && !path.startsWith('/admin') && !path.startsWith('/lms')) {
      const seo = ROUTE_SEO[path] || ROUTE_SEO['/']
      document.title = seo.title
      
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', seo.description)
      }
      
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) ogTitle.setAttribute('content', seo.title)
      
      const ogDesc = document.querySelector('meta[property="og:description"]')
      if (ogDesc) ogDesc.setAttribute('content', seo.description)
    }
  }, [location])

  // Hide global Header and Footer on admin, dashboard, course, account, and auth paths
  const hideHeaderFooter = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/course/') ||
    location.pathname.startsWith('/account') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/setup-account' ||
    location.pathname.startsWith('/l/')

  // WhatsApp widget: show in checkout page, course learning center, and user dashboard
  const showWhatsApp = 
    location.pathname.startsWith('/checkout') || 
    location.pathname.startsWith('/course/') || 
    location.pathname.startsWith('/dashboard')

  const isDashboard = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/course/') ||
    location.pathname.startsWith('/account')

  return (
    <div className={isDashboard ? 'dashboard-layout-root' : 'public-layout-root'}>
      <ScrollToTop />
      {!hideHeaderFooter && <Header />}
      
      {/* Toast container */}
      <div id="toast-root" />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/category/:categorySlug" element={<ProductsPage />} />
        <Route path="/category/:categorySlug/:subcategorySlug" element={<ProductsPage />} />
        <Route path="/product/:productId" element={<ProductDetailsPage />} />
        <Route path="/l/:slug" element={<LandingPageRenderer />} />
        <Route path="/about" element={<AboutPage />} />
        {featureFlags.enable_academics && (
          <>
            <Route path="/ebook" element={<EbookSalesPage />} />
            <Route path="/course" element={<SalesPage />} />
            <Route path="/course/:courseId" element={<LMSCourse />} />
            <Route path="/course/:courseId/:lessonId" element={<LMSCourse />} />
          </>
        )}
        <Route path="/checkout" element={<PaymentPage />} />
        <Route path="/success" element={<ThankYouPage />} />
        <Route path="/setup-account" element={<SetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<LMSDashboard />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/quality" element={<QualityPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/affiliate" element={featureFlags.enable_affiliates ? <AffiliatePage /> : <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050b14', color: '#fff' }}><h2>Affiliate System is temporarily disabled</h2></div>} />

        {/* Dynamic / Auto-registered user created pages */}
        {getPages().map(page => {
          const staticPaths = [
            '/', '/products', '/product/:productId',
            '/about', '/ebook', '/course', '/checkout', '/success', '/setup-account', '/login',
            '/register', '/forgot-password', '/reset-password', '/dashboard', '/course/:courseId',
            '/course/:courseId/:lessonId', '/account', '/admin/*', '/terms', '/privacy', '/refund',
            '/contact', '/blog', '/faq', '/quality', '/export', '/gallery'
          ]
          if (staticPaths.includes(page.path)) return null;
          return <Route key={page.path} path={page.path} element={<page.component />} />
        })}

        {/* Fallback to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>

      {!hideHeaderFooter && <Footer />}
      {!location.pathname.startsWith('/admin') && <WhatsAppWidget />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </CurrencyProvider>
    </AuthProvider>
  )
}
