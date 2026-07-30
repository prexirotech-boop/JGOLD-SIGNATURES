import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manually parse .env file
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
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

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTriggers() {
  console.log('Inspecting active database triggers...');
  
  // Since we cannot run raw sql, we will use RPC if available or check triggers via query
  // Wait, let's see if we can query pg_trigger through a select on a custom function or RPC.
  // If not, we can query profiles structure to verify columns.
  
  console.log('\nChecking public.traffic_events table columns...');
  const { data: trafficData, error: trafficErr } = await supabase
    .from('traffic_events')
    .select('*')
    .limit(1);
    
  if (trafficErr) {
    console.error('Error querying traffic_events:', trafficErr.message, trafficErr.details, trafficErr.hint);
  } else {
    console.log('Successfully queried traffic_events! Columns present:', Object.keys(trafficData[0] || {}));
  }

  console.log('\nChecking public.profiles table columns...');
  const { data: profileData, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
    
  if (profileErr) {
    console.error('Error querying profiles:', profileErr.message);
  } else {
    console.log('Successfully queried profiles! Columns present:', Object.keys(profileData[0] || {}));
  }
}

inspectTriggers();
