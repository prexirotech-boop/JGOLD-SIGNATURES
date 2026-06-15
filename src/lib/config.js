export const CONFIG = {
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_d786df7f8dcd32ac7132be78cdab581b93e9ade8',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://zisbhfwxaiqtxtkecyow.supabase.co',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  PRICE_KOBO: 1000000,           // ₦10,000 in kobo
  PRICE_NAIRA: 10000,
  PRICE_DISPLAY: '₦10,000',
  ORIGINAL_PRICE: '₦50,000',
  BOOK_TITLE: 'Freelance Web Design Mastery Program',
  AUTHOR: 'Nnanta Precious',
}

