import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in your env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUsers() {
  console.log('--- AUTH USERS ---');
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Error listing auth users:', authErr.message);
  } else {
    users.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Role (metadata): ${u.app_metadata?.role}`);
      console.log('------------------');
    });
  }

  console.log('\n--- PUBLIC PROFILES ---');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*');
  if (profErr) {
    console.error('Error listing profiles:', profErr.message);
  } else {
    profiles.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Email: ${p.email}`);
      console.log(`Role (table): ${p.role}`);
      console.log('------------------');
    });
  }
}

checkUsers().catch(console.error);
