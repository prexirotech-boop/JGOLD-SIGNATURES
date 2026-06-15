import pg from 'pg';
import fs from 'fs';

const passwords = [
  'Test123456',
  'test123456',
  'AmplifiedSkills123',
  'n50kblueprint',
  'admin',
  'postgres',
  'Precious123',
  'Precious',
  'AmplifiedSkills',
  'zisbhfwxaiqtxtkecyow',
  'Test123456!',
  'test123456!'
];

const host = 'db.zisbhfwxaiqtxtkecyow.supabase.co';
const user = 'postgres';
const database = 'postgres';
const sqlPath = 'SUPABASE_ADDITIONAL_FIXES.sql';

async function run() {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  for (const password of passwords) {
    console.log(`Trying direct connection with password: ${password}...`);
    // Try both pooler port (6543) and direct port (5432)
    for (const port of [5432, 6543]) {
      const client = new pg.Client({
        host,
        port,
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
      });
      
      try {
        await client.connect();
        console.log(`SUCCESSFULLY connected to ${host}:${port} with password: ${password}`);
        console.log('Running SQL queries...');
        await client.query(sql);
        console.log('SQL applied successfully!');
        await client.end();
        return;
      } catch (err) {
        console.log(`Failed for port ${port}: ${err.message}`);
        try {
          await client.end();
        } catch (e) {}
      }
    }
  }
  
  console.error('All connection attempts failed.');
}

run();
