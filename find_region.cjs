const pg = require('pg');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'sa-east-1', 'ca-central-1'
];

const ref = 'zisbhfwxaiqtxtkecyow';

async function findRegion() {
  for (const r of regions) {
    const host = `aws-0-${r}.pooler.supabase.com`;
    const client = new pg.Client({
      host,
      port: 6543,
      user: `postgres.${ref}`,
      password: 'dummy-password-to-test-connection',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`Region ${r}: CONNECTED`);
      await client.end();
    } catch (err) {
      if (err.message.includes('Tenant or user not found')) {
        console.log(`Region ${r}: Tenant not found`);
      } else if (err.message.includes('password authentication failed') || err.code === '28P01') {
        console.log(`Region ${r}: CORRECT REGION! Authentication failed as expected.`);
      } else {
        console.log(`Region ${r}: Other error - ${err.message}`);
      }
      try {
        await client.end();
      } catch (e) {}
    }
  }
}

findRegion();
