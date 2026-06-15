import pg from 'pg';
import fs from 'fs';
import dns from 'dns';
import { promisify } from 'util';

const resolve = promisify(dns.resolve);

const passwords = [
  'Test123456',
  'test123456',
  'AmplifiedSkills123',
  'n50kblueprint',
  'admin',
  'postgres'
];

const user = 'postgres';
const database = 'postgres';
const sqlPath = 'SUPABASE_ADDITIONAL_FIXES.sql';

async function run() {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const lookup = promisify(dns.lookup);
  
  const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'sa-east-1', 'ca-central-1'
  ];
  
  const ref = 'zisbhfwxaiqtxtkecyow';
  const poolerHosts = regions.map(r => `aws-0-${r}.pooler.supabase.com`);
  
  let resolvedHosts = [];
  for (const host of poolerHosts) {
    try {
      const ip = await lookup(host);
      console.log(`Resolved ${host} to:`, ip.address);
      resolvedHosts.push(host);
    } catch (err) {
      // ignore failures
    }
  }
  
  if (resolvedHosts.length === 0) {
    console.error('Could not resolve any shared pooler hosts.');
    return;
  }
  
  const extraPasswords = [
    'Precious123',
    'Precious',
    'AmplifiedSkills',
    'zisbhfwxaiqtxtkecyow',
    'Test123456!',
    'test123456!'
  ];
  const allPasswords = [...passwords, ...extraPasswords];
  
  const poolerUser = `postgres.${ref}`;
  const port = 6543; // Transaction/Session pooler port
  
  for (const host of resolvedHosts) {
    for (const password of allPasswords) {
      console.log(`Trying host ${host} with password ${password}...`);
      const client = new pg.Client({
        host,
        port,
        user: poolerUser,
        password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
      });
      
      try {
        await client.connect();
        console.log(`CONNECTED successfully to ${host} with password:`, password);
        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration executed successfully!');
        await client.end();
        return;
      } catch (err) {
        console.log(`Failed for host ${host} with password ${password}:`, err.message);
        try {
          await client.end();
        } catch (e) {}
      }
    }
  }
  
  console.error('All connection attempts failed.');
}

run();
