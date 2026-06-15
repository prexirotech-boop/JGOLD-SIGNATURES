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
  const testEmail = `lead_${Date.now()}@example.com`;
  console.log(`Testing subscriber insert for: ${testEmail}`);
  
  const { data, error } = await supabase
    .from('subscribers')
    .insert({
      email: testEmail,
      name: 'Test Lead',
      phone: '08012345678',
      source: 'free_training'
    })
    .select();
    
  if (error) {
    console.error('Insert failed:', error.message, error.details || '');
  } else {
    console.log('Insert successful! Column "phone" exists.', data);
    // Cleanup
    await supabase.from('subscribers').delete().eq('email', testEmail);
  }
}
run();
