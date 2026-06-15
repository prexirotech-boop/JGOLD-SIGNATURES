import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@amplifiedskills.com',
    password: 'Test123456'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  console.log('Login successful! Updating product title...');
  const { data, error } = await supabase
    .from('products')
    .update({ 
      title: 'Freelance Web Design Blueprint',
      slug: 'freelance-web-design-blueprint'
    })
    .eq('id', '4de71a50-9659-4bd0-85c6-35c621dd8e50')
    .select();
    
  if (error) {
    console.error('Error updating product:', error);
  } else {
    console.log('Successfully updated product:', data);
  }
  
  // Also check if there's any course description or other details that mention "Blueprint Slug" or similar
}
run();
