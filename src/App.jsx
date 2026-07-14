import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
    title: 'MIFAS FARMS — Premium Organic Agro-Exports & Logistics',
    description: 'MIFAS FARMS offers premium organic agricultural products, agro-exports, and farm produce logistics. Order top quality agricultural exports directly from our storefront.'
  },
  '/about': {
    title: 'About Us — MIFAS FARMS Premium Agricultural Exports',
    description: 'Learn about MIFAS FARMS, our mission, sustainable agricultural practices, and how we deliver premium export-grade produce from Nigeria to the world.'
  },
  '/products': {
    title: 'Shop Export-Grade Agricultural Products — MIFAS Store',
    description: 'Browse and purchase top-quality agricultural products including cashew nuts, ginger, chili pepper, and cocoa beans directly from our export-grade store.'
  },
  '/contact': {
    title: 'Contact Us — MIFAS FARMS Customer Support',
    description: 'Get in touch with MIFAS FARMS. Contact our sales and logistics team for inquiries about agricultural export rates, shipping, and bulk orders.'
  },
  '/blog': {
    title: 'Agro-Export & Farming Insights Blog — MIFAS FARMS',
    description: 'Stay updated with the latest trends, insights, guides, and farming techniques in the Nigerian agro-export and agricultural logistics sector.'
  },
  '/faq': {
    title: 'Frequently Asked Questions — MIFAS FARMS Support',
    description: 'Find answers to common questions about MIFAS FARMS product ordering, quality standards, shipping logistics, payment options, and refund policy.'
  },
  '/affiliate': {
    title: 'Affiliate Partnership Program — MIFAS FARMS',
    description: 'Join the MIFAS FARMS affiliate program. Earn generous commissions by referring buyers to our export-grade agricultural store.'
  },
  '/quality': {
    title: 'Premium Export Standards & Quality Assurance — MIFAS FARMS',
    description: 'MIFAS Agricultural Exports operates under strict international quality guidelines, ensuring all shipments meet phytosanitary and export grade certifications.'
  },
  '/export': {
    title: 'Global Agro-Export & Trade Services — MIFAS FARMS',
    description: 'MIFAS Agricultural Exports specializes in sourcing, processing, packaging, and shipping premium Nigerian agricultural commodities globally.'
  },
  '/gallery': {
    title: 'MIFAS FARMS — Photo Gallery & Operations',
    description: 'Take a virtual tour of MIFAS FARMS. Explore our farms, processing facilities, quality inspection processes, and logistics operations in Nigeria.'
  },
  '/terms': {
    title: 'Terms of Service — MIFAS FARMS',
    description: 'Read the terms and conditions governing the use of MIFAS FARMS website, storefront, ordering system, and agro-export services.'
  },
  '/privacy': {
    title: 'Privacy Policy — MIFAS FARMS',
    description: 'Review our privacy policy to understand how MIFAS FARMS collects, uses, protects, and handles your personal and transactional information.'
  },
  '/refund': {
    title: 'Refund & Cancellation Policy — MIFAS FARMS',
    description: 'Understand the terms, conditions, and procedures for refunds, returns, or order cancellations at MIFAS FARMS Store.'
  }
}

function AppLayout() {
  const location = useLocation()

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
    location.pathname === '/setup-account'

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
        <Route path="/product/:productId" element={<ProductDetailsPage />} />
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
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
