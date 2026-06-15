import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

const sql = `
  UPDATE public.products 
  SET title = 'Freelance Web Design Blueprint', 
      slug = 'freelance-web-design-blueprint' 
  WHERE id = '4de71a50-9659-4bd0-85c6-35c621dd8e50';
`;

async function run() {
  console.log('Running RPC exec_sql...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({ sql })
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Result:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}
run();
