import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://zisbhfwxaiqtxtkecyow.supabase.co';
const serviceRoleKey = env.VITE_SUPABASE_ANON_KEY;
const projectRef = 'zisbhfwxaiqtxtkecyow';

// The migration SQL to add missing columns
const migrationSQL = `
-- Add missing columns to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_desc TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price INTEGER;

-- Add unique constraint on slug if not exists  
DO $$ BEGIN
  BEGIN
    CREATE UNIQUE INDEX products_slug_key ON products(slug) WHERE slug IS NOT NULL;
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END $$;

-- Add missing columns to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_learn JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS who_is_for JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS preview_video TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_threshold INTEGER DEFAULT 80;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_duration TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
`;

async function runMigrationViaAPI() {
  console.log('Attempting migration via Supabase Management API...');
  
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({ query: migrationSQL })
    });
    
    const result = await response.json();
    console.log('Management API response status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Migration applied successfully via Management API!');
      return true;
    }
  } catch (err) {
    console.log('Management API failed:', err.message);
  }
  return false;
}

async function runMigrationViaRPC() {
  console.log('\nAttempting migration via direct REST calls...');
  
  // Try individual ALTER TABLE statements via exec_sql RPC if it exists
  const statements = migrationSQL.split(';').map(s => s.trim()).filter(s => s.length > 5);
  
  for (const stmt of statements) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql: stmt })
      });
      
      if (response.ok) {
        console.log('✅ Executed:', stmt.substring(0, 60));
      } else {
        const err = await response.json();
        if (err.message && err.message.includes('already exists')) {
          console.log('⏭️  Skipping (already exists):', stmt.substring(0, 60));
        } else {
          console.log('❌ Failed:', stmt.substring(0, 60), '-', err.message || JSON.stringify(err));
        }
      }
    } catch (err) {
      console.log('❌ Error on stmt:', err.message);
    }
  }
}

async function notifySchemaReload() {
  // Try to reload PostgREST schema cache
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/notify_pgrst`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({})
    });
    if (response.ok) console.log('Schema cache reload triggered');
  } catch (e) {}
}

async function checkColumnsExist() {
  console.log('\nChecking current schema via API...');
  const url = `${supabaseUrl}/rest/v1/`;
  const response = await fetch(url, {
    headers: { 'apikey': serviceRoleKey, 'Authorization': `Bearer ${serviceRoleKey}` }
  });
  const spec = await response.json();
  
  const productCols = Object.keys(spec.definitions?.products?.properties || {});
  const courseCols = Object.keys(spec.definitions?.courses?.properties || {});
  
  console.log('Products columns:', productCols);
  console.log('Courses columns:', courseCols);
  
  const missingFromProducts = ['slug', 'meta_title', 'meta_desc'].filter(c => !productCols.includes(c));
  const missingFromCourses = ['level', 'what_you_learn', 'preview_video'].filter(c => !courseCols.includes(c));
  
  console.log('\nMissing from products:', missingFromProducts.length ? missingFromProducts : 'None ✅');
  console.log('Missing from courses:', missingFromCourses.length ? missingFromCourses : 'None ✅');
  
  return missingFromProducts.length === 0 && missingFromCourses.length === 0;
}

async function main() {
  const alreadyComplete = await checkColumnsExist();
  if (alreadyComplete) {
    console.log('\n✅ Schema is already complete! No migration needed.');
    return;
  }
  
  const mgmtSuccess = await runMigrationViaAPI();
  if (!mgmtSuccess) {
    await runMigrationViaRPC();
  }
  
  // Check again
  console.log('\n--- Re-checking after migration attempt ---');
  await checkColumnsExist();
}

main().catch(console.error);
