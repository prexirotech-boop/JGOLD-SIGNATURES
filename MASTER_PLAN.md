# AMPLIFIED SKILLS — SINGLE-INSTRUCTOR PLATFORM
Full Implementation Plan (Revised)
Platform Model: Solo Creator / Course Author Platform Instructor: You (Precious) — also the Admin Version: 2.0

## SECTION 1: REVISED PLATFORM MODEL
Since this is your own platform (not a marketplace), the following structural changes apply from the previous version:
- There is no instructor registration, application, or approval flow
- The Instructor Dashboard and Admin Panel are merged into one — you access everything from a single backend dashboard
- The "Become an Instructor" public page is removed
- The Instructor Public Profile page becomes your personal Creator/About page
- Revenue flows 100% to you — no commission splits or instructor payouts
- Course publishing is instant — no review queue needed since you are the only publisher
- All references to "Instructor Management" in admin are removed

## SECTION 2: USER TYPES (SIMPLIFIED)
- Guest / Visitor: Unauthenticated visitor browsing the site
- Student: Registered learner who purchases and accesses courses
- Admin (You): Full platform control — create courses, manage students, view revenue, configure everything

## SECTION 3: PHASED BUILD PLAN (REVISED FOR SOLO PLATFORM)
### 🟢 Phase 1 — Launch-Ready MVP (Months 1–2)
Goal: Be able to sell and deliver at least one course.
- Authentication (email + Google OAuth, email verification, password reset)
- Student role + Admin role (you)
- Homepage (hero, featured courses, about section, footer)
- Course catalog page (browse, basic filter)
- Course detail page (with purchase CTA)
- Course builder (video + article lessons, pricing, publish)
- Course player (video, curriculum nav, progress tracking, mark complete)
- Shopping cart and Paystack checkout
- Order confirmation + purchase history
- Student dashboard (continue learning, enrolled courses)
- Student profile and settings (basic)
- Admin overview dashboard
- Admin student management (view enrolled students, progress)
- Admin revenue dashboard (basic income summary)
- Transactional emails: Welcome, Purchase Receipt, Password Reset
- Contact page
- Legal pages (Terms, Privacy, Refund Policy)
- 404 and error pages
- Mobile-responsive design throughout

### 🟡 Phase 2 — Full Product (Months 3–4)
Goal: Complete the learning experience and monetization tools.
- Quiz builder and quiz lesson type
- Certificate engine (auto-issue PDF on completion)
- Student certificates page (view, download, share)
- Review and rating system (student submits, you moderate)
- Q&A module (student asks, you reply in admin)
- Announcement / email broadcast to students
- Coupon and discount manager
- Wishlist page
- Notification center (in-app)
- Blog / resources section (for SEO)
- Category management in admin
- Course analytics (completion rate, drop-off, watch time)
- Email template editor
- Refund management
- SEO settings (meta tags per page, sitemap)
- FAQ page

### 🔵 Phase 3 — Growth & Retention (Months 5–6)
- Learning paths / course bundles
- Affiliate / referral program
- Drip content scheduler
- Learning streak and goal tracker
- Subscription / membership pricing tier
- Community discussion forum
- Advanced platform analytics (traffic sources, funnels, DAU/MAU)
- PWA setup
- Live chat widget integration

### 🔵 Phase 4 — Scale (Month 7+)
- Live sessions / webinar module
- Assignment builder with file submissions
- Mobile app (React Native)
- Multi-language support
- Full-text search upgrade (Algolia)
- AI-powered course recommendations
- Advanced certificate with LinkedIn verification

## SECTION 4: TECH STACK
- Frontend: React 18 + Vite + Custom CSS (std-layout)
- Backend/DB: Supabase (PostgreSQL + Auth + Storage)
- Video: Wistia
- Payments: Paystack (Working perfectly - DO NOT TOUCH)
- Hosting: Vercel

## IMPLEMENTATION NOTES
- Ensure `std-layout` and existing design variables are used for all new components.
- Admin dashboard must contain Course Builder, Student Management, Revenue Dashboard.
- Paystack integration is already working on `PaymentPage.jsx` and `SalesPage.jsx` - preserve this logic.
