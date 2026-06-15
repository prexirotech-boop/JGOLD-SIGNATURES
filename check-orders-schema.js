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

async function testAdminQueries() {
  console.log('Testing courses joining products and enrollments...');
  const { data: courses, error: coursesErr } = await supabase
    .from('courses')
    .select('id, level, products(title), enrollments(id)');
  console.log('Courses result error:', coursesErr);
  console.log('Courses result count:', courses?.length);

  console.log('Testing orders joining products...');
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('id, reference, customer_email, products(title)');
  console.log('Orders result error:', ordersErr);
  console.log('Orders result count:', orders?.length);
}

testAdminQueries();
