import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually to avoid extra dependencies
function parseEnv() {
  const envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const config = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      config[key] = value.trim();
    }
  });
  return config;
}

const env = parseEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Connecting to Supabase at:", supabaseUrl);
  
  // 1. Fetch current payment_config
  const { data: current, error: getErr } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'payment_config')
    .maybeSingle();

  if (getErr) {
    console.error("Failed to read settings table:", getErr.message);
    process.exit(1);
  }

  const currentValue = current?.value || {};
  
  const updatedValue = {
    ...currentValue,
    paystack_public_key: 'pk_test_f5ca548b75fd9f37b9ff2bfe93a1ae0f07021856',
    paystack_secret_key: 'sk_test_c0fca215344135e9ca84b48352e45fa6b28746d8'
  };

  // 2. Upsert payment_config with new keys
  const { error: upsertErr } = await supabase
    .from('settings')
    .upsert({
      id: 'payment_config',
      value: updatedValue,
      updated_at: new Date().toISOString()
    });

  if (upsertErr) {
    console.error("Failed to update payment_config in settings table:", upsertErr.message);
    process.exit(1);
  }

  console.log("Successfully updated Paystack keys in database settings table!");
}

run();
