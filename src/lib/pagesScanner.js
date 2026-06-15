// Dynamic scanning of pages inside src/pages
const pageModules = import.meta.glob('../pages/*.jsx', { eager: true });

const ROUTE_MAP = {
  'HomePage': { path: '/', label: 'Home Page', desc: 'Main landing / hero page', color: '#2563eb' },
  'LandingPage': { path: '/free-training', label: 'Freelance Web Design Opt-in', desc: 'High-converting Clickfunnels-style landing page with video & form', color: '#0ea5e9' },
  'WebinarPage': { path: '/webinar', label: 'Webinar Replay / Training', desc: 'Learning focused webinar page with video, resources copy, and upsell CTA', color: '#3b82f6' },
  'ProductsPage': { path: '/products', label: 'Products Page', desc: 'All products catalog listing', color: '#f59e0b' },
  'ProductDetailsPage': { path: '/product/:productId', label: 'Product Details', desc: 'Product details page', color: '#10b981', isDynamic: true },
  'AboutPage': { path: '/about', label: 'About Page', desc: 'About the brand / company', color: '#8b5cf6' },
  'EbookSalesPage': { path: '/ebook', label: 'Ebook Sales Page', desc: 'Sales page for the blueprint ebook', color: '#10b981' },
  'SalesPage': { path: '/course', label: 'Course Sales Page', desc: 'Sales page for the main course product', color: '#0ea5e9' },
  'PaymentPage': { path: '/checkout', label: 'Checkout / Payment', desc: 'Payment and order form page', color: '#3b82f6' },
  'ThankYouPage': { path: '/success', label: 'Thank You Page', desc: 'Order success / confirmation page', color: '#10b981' },
  'TermsPage': { path: '/terms', label: 'Terms of Service', desc: 'Legal terms and conditions', color: '#6b7280' },
  'PrivacyPage': { path: '/privacy', label: 'Privacy Policy', desc: 'Data privacy policy', color: '#64748b' },
  'RefundPage': { path: '/refund', label: 'Refund Policy', desc: 'Refund and returns policy', color: '#ef4444' },
  'ContactPage': { path: '/contact', label: 'Contact Page', desc: 'Contact form and info', color: '#f97316' },
  'BlogPage': { path: '/blog', label: 'Blog Page', desc: 'News and articles listing', color: '#ec4899' },
  'FAQPage': { path: '/faq', label: 'FAQ Page', desc: 'Frequently Asked Questions', color: '#14b8a6' },
};

// Helper to convert PascalCase to space-separated words
function formatLabel(name) {
  let s = name;
  if (s.endsWith('Page')) {
    s = s.slice(0, -4);
  }
  return s.replace(/([A-Z])/g, ' $1').trim() + ' Page';
}

// Helper to convert PascalCase to kebab-case path
function formatPath(name) {
  let s = name;
  if (s.endsWith('Page')) {
    s = s.slice(0, -4);
  }
  return '/' + s.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

export const getPages = () => {
  const pages = [];
  
  for (const path in pageModules) {
    const filename = path.split('/').pop(); // e.g. "AboutPage.jsx"
    const componentName = filename.replace('.jsx', ''); // e.g. "AboutPage"
    
    // Skip admin, dashboard, Q&A, and authentication pages from being shown in the public pages list
    if (
      componentName.startsWith('Admin') || 
      componentName.startsWith('LMS') ||
      [
        'LoginPage', 
        'RegisterPage', 
        'ForgotPasswordPage', 
        'ResetPasswordPage', 
        'SetPasswordPage', 
        'AccountPage',
        'StudentCertificates'
      ].includes(componentName)
    ) {
      continue;
    }
    
    const component = pageModules[path].default;
    if (!component) continue;

    // Get config or generate default
    const config = ROUTE_MAP[componentName] || {
      path: formatPath(componentName),
      label: formatLabel(componentName),
      desc: `Custom user-created page (${componentName})`,
      color: '#6366f1'
    };

    pages.push({
      id: componentName.toLowerCase(),
      componentName,
      label: config.label,
      path: config.path,
      color: config.color,
      desc: config.desc,
      component,
      isDynamic: config.isDynamic || false
    });
  }
  
  return pages;
};
