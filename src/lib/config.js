export const CONFIG = {
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_live_80644abb4427bd70d196e46434d37b0a6122aea3',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://uivlyvewbdxvbitavfva.supabase.co',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  ENABLE_DIGITAL_PRODUCTS: false, // Set to true to re-enable Courses and E-Books
  PRICE_KOBO: 1000000,           // ₦10,000 in kobo
  PRICE_NAIRA: 10000,
  PRICE_DISPLAY: '₦10,000',
  ORIGINAL_PRICE: '₦50,000',
  BOOK_TITLE: 'Premium E-Commerce Product',
  AUTHOR: 'E-Com Store',
}

