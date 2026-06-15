import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log('Querying products...');
  const { data: products, error: pErr } = await supabase.from('products').select('*');
  if (pErr) console.error('Products Error:', pErr);
  else console.log('Products count:', products?.length);

  console.log('Querying courses...');
  const { data: courses, error: cErr } = await supabase.from('courses').select('*');
  if (cErr) console.error('Courses Error:', cErr);
  else console.log('Courses count:', courses?.length);

  console.log('Querying reviews...');
  const { data: reviews, error: rErr } = await supabase.from('reviews').select('*');
  if (rErr) console.error('Reviews Error:', rErr);
  else console.log('Reviews count:', reviews?.length, reviews);
}
check();
