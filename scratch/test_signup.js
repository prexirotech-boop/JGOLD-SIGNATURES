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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env', env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const randomEmail = `test_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  console.log(`Testing signup with email: ${randomEmail}`);
  
  const { data, error } = await supabase.auth.signUp({
    email: randomEmail,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test Diagnostics User'
      }
    }
  });

  if (error) {
    console.error('Signup API Error Code:', error.status);
    console.error('Signup API Error Message:', error.message);
  } else {
    console.log('Signup call completed successfully (HTTP 200)! User ID:', data.user?.id);
    
    console.log('Waiting 2 seconds to check debug logs table...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Querying public.debug_logs for any database exceptions...');
    const { data: logs, error: logsError } = await supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (logsError) {
      console.error('Error querying debug_logs:', logsError.message);
    } else if (logs && logs.length > 0) {
      console.log('\n--- DATABASE LOGS DETECTED ---');
      logs.forEach(log => {
        console.log(`Log ID: ${log.id}`);
        console.log(`Timestamp: ${log.created_at}`);
        console.log(`Action: ${log.action}`);
        console.log(`Error Message: ${log.error_message}`);
        console.log(`Error Detail: ${log.error_detail}`);
        console.log(`Error SQLSTATE: ${log.error_state}`);
        console.log('-------------------------------\n');
      });
    } else {
      console.log('No database errors logged in debug_logs. Trigger ran cleanly!');
    }
  }
}

test();
