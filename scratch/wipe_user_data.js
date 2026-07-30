import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// DANGER: PROGRAMMATIC USER DATA & ACCOUNTS WIPE SCRIPT
// ═══════════════════════════════════════════════════════════════════════════
// This script permanently deletes all user accounts, profiles, orders, and
// associated user files from your Supabase instance using the Admin SDK.
//
// REQUIREMENTS:
// 1. You must provide the Supabase 'service_role' key.
//    (Find this in Supabase Dashboard -> Settings -> API -> service_role secret).
// 2. Do NOT expose this key in client-side code or commit it to Git.
// ═══════════════════════════════════════════════════════════════════════════

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

// Load variables from env, preferring process.env (set by CLI) or .env file
const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
// MUST use service_role key to delete users and bypass RLS
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL is not set.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY is not set.');
  console.log('\nTo run this script, you must provide your Supabase Service Role (Admin) key.');
  console.log('You can find it in your Supabase Dashboard under:');
  console.log('👉 Project Settings -> API -> Project API Keys -> service_role (secret)\n');
  console.log('You can run this script by setting the environment variable in your terminal:');
  console.log('  Windows (PowerShell):  $env:SUPABASE_SERVICE_ROLE_KEY="your-key"; node scratch/wipe_user_data.js');
  console.log('  Windows (CMD):         set SUPABASE_SERVICE_ROLE_KEY=your-key && node scratch/wipe_user_data.js');
  console.log('  Linux/macOS:           SUPABASE_SERVICE_ROLE_KEY="your-key" node scratch/wipe_user_data.js\n');
  console.log('Or by adding it to your .env file:');
  console.log('  SUPABASE_SERVICE_ROLE_KEY="your-secret-service-role-key-here"\n');
  process.exit(1);
}

// Initialize Supabase Client with the service_role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function wipeUserData() {
  console.log('⚠️ WARNING: Wiping all user data and accounts including admins... ⚠️');
  console.log(`Target Supabase URL: ${supabaseUrl}`);
  console.log('Starting wipe in 3 seconds (press Ctrl+C to abort)...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 1. Empty storage buckets
  console.log('\n[1/4] Emptying user storage buckets...');
  const buckets = ['avatars', 'payment-receipts'];
  for (const bucket of buckets) {
    try {
      console.log(`  Emptying bucket: ${bucket}...`);
      const { data, error } = await supabase.storage.emptyBucket(bucket);
      if (error) {
        // If bucket doesn't exist or error, log it
        console.warn(`  Warning/Error emptying bucket ${bucket}:`, error.message);
      } else {
        console.log(`  Successfully emptied bucket: ${bucket}`);
      }
    } catch (err) {
      console.error(`  Failed to empty bucket ${bucket}:`, err);
    }
  }

  // 2. Delete analytics, tracking, and logs
  console.log('\n[2/4] Wiping tracking events, upsell impressions, and debug logs...');
  
  // Wipe traffic events
  const { error: trafficErr } = await supabase
    .from('traffic_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (trafficErr) console.error('  Error deleting traffic_events:', trafficErr.message);
  else console.log('  Cleared public.traffic_events');

  // Wipe upsell impressions
  const { error: upsellErr } = await supabase
    .from('upsell_impressions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (upsellErr) console.error('  Error deleting upsell_impressions:', upsellErr.message);
  else console.log('  Cleared public.upsell_impressions');

  // Wipe debug logs
  const { error: logsErr } = await supabase
    .from('debug_logs')
    .delete()
    .gt('id', 0);
  if (logsErr) console.error('  Error deleting debug_logs:', logsErr.message);
  else console.log('  Cleared public.debug_logs');

  // 3. Delete orders (and order_items via cascade)
  console.log('\n[3/4] Wiping purchase orders and order items...');
  const { error: ordersErr } = await supabase
    .from('orders')
    .delete()
    .gt('id', 0);
  if (ordersErr) console.error('  Error deleting orders:', ordersErr.message);
  else console.log('  Cleared public.orders and public.order_items');

  // 4. Delete all user accounts (including admins)
  console.log('\n[4/4] Fetching and deleting all user accounts from Auth...');
  
  let page = 1;
  let hasMore = true;
  let deletedCount = 0;

  while (hasMore) {
    console.log(`  Fetching page ${page} of users...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 50
    });

    if (listError) {
      console.error('  Error listing users:', listError.message);
      break;
    }

    if (!users || users.length === 0) {
      console.log('  No users found on this page.');
      hasMore = false;
      break;
    }

    console.log(`  Found ${users.length} user(s) on page ${page}. Deleting...`);

    for (const user of users) {
      console.log(`    Deleting user: ${user.email} (${user.id})...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        console.error(`    ❌ Failed to delete user ${user.email}:`, deleteError.message);
      } else {
        console.log(`    ✅ Successfully deleted user ${user.email}`);
        deletedCount++;
      }
    }

    // If the list of users returned is less than our limit, there are no more pages
    if (users.length < 50) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log(`🎉 WIPE COMPLETE! Deleted ${deletedCount} user accounts.`);
  console.log('All profiles, enrollments, wishlists, reviews, commissions, and notes');
  console.log('have been cascade deleted.');
  console.log('═══════════════════════════════════════════════════════════════════════════');
}

wipeUserData().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
