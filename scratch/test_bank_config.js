import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://uivlyvewbdxvbitavfva.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdmx5dmV3YmR4dmJpdGF2ZnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NDE1MjMsImV4cCI6MjA5OTQxNzUyM30.f7WjW4ZPjza0MEqVoTpD6TjXWebWD5ootI0Yoc93UlI"
)

async function test() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 'bank_config').maybeSingle()
  if (error) {
    console.error('Error fetching bank_config:', error)
  } else {
    console.log('bank_config data:', JSON.stringify(data, null, 2))
  }
}

test()
