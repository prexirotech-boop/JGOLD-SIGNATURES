import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ProductsPage from './pages/ProductsPage'
import EbookSalesPage from './pages/EbookSalesPage'
import SalesPage from './pages/SalesPage'
import PaymentPage from './pages/PaymentPage'
import ThankYouPage from './pages/ThankYouPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import LandingPage from './pages/LandingPage'
import WebinarPage from './pages/WebinarPage'

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
import WhatsAppWidget from './components/WhatsAppWidget'

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { trackEvent } from './lib/analytics'
import { getPages } from './lib/pagesScanner'

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppLayout() {
  const location = useLocation()
  
  // Track PageView on location changes for Facebook Pixel & DB Analytics
  useEffect(() => {
    trackEvent('page_view')
  }, [location])

  // Affiliate referral tracking disabled for now
  
  // Hide global Header and Footer on admin, student portal, course player, landing, and auth paths
  const hideHeaderFooter = 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/course/') ||
    location.pathname.startsWith('/account') ||
    location.pathname.startsWith('/free-training') ||
    location.pathname.startsWith('/freelance-web-design-lander') ||
    location.pathname.startsWith('/webinar') ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password' ||
    location.pathname === '/reset-password' ||
    location.pathname === '/setup-account'

  // WhatsApp widget: only show in webinar page, course learning center, and user dashboard
  const showWhatsApp = 
    location.pathname.startsWith('/webinar') || 
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
        <Route path="/free-training" element={<LandingPage />} />
        <Route path="/freelance-web-design-lander" element={<LandingPage />} />
        <Route path="/webinar" element={<WebinarPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/product/:productId" element={<ProductDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/ebook" element={<EbookSalesPage />} />
        <Route path="/course" element={<SalesPage />} />
        <Route path="/checkout" element={<PaymentPage />} />
        <Route path="/success" element={<ThankYouPage />} />
        <Route path="/setup-account" element={<SetPasswordPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<LMSDashboard />} />
        <Route path="/course/:courseId" element={<LMSCourse />} />
        <Route path="/course/:courseId/:lessonId" element={<LMSCourse />} />
        <Route path="/account" element={<LMSDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund" element={<RefundPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/affiliate" element={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050b14', color: '#fff' }}><h2>Affiliate System is temporarily disabled</h2></div>} />

        {/* Dynamic / Auto-registered user created pages */}
        {getPages().map(page => {
          const staticPaths = [
            '/', '/free-training', '/freelance-web-design-lander', '/products', '/product/:productId',
            '/about', '/ebook', '/course', '/checkout', '/success', '/setup-account', '/login',
            '/register', '/forgot-password', '/reset-password', '/dashboard', '/course/:courseId',
            '/course/:courseId/:lessonId', '/account', '/admin/*', '/terms', '/privacy', '/refund',
            '/contact', '/blog', '/faq'
          ]
          if (staticPaths.includes(page.path)) return null;
          return <Route key={page.path} path={page.path} element={<page.component />} />
        })}

        {/* Fallback to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>

      {!hideHeaderFooter && <Footer />}
      {showWhatsApp && <WhatsAppWidget />}
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
