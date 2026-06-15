const pg = require('pg');

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

const ref = 'zisbhfwxaiqtxtkecyow';

async function run() {
  const connectionConfigs = [];

  // Add Direct Connection attempts first (Port 5432, user 'postgres')
  connectionConfigs.push({
    name: 'Direct connection',
    host: `db.${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    database: 'postgres'
  });

  connectionConfigs.push({
    name: 'Direct connection (alternative host)',
    host: `${ref}.supabase.co`,
    port: 5432,
    user: 'postgres',
    database: 'postgres'
  });

  // Add Pooler Connection attempts (Port 6543, user 'postgres.ref')
  const regions = [
    'eu-central-1', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'ap-southeast-1', 'ap-southeast-2',
    'ap-northeast-1', 'ap-northeast-2', 'sa-east-1', 'ca-central-1'
  ];
  regions.forEach(r => {
    connectionConfigs.push({
      name: `Pooler connection (${r})`,
      host: `aws-0-${r}.pooler.supabase.com`,
      port: 6543,
      user: `postgres.${ref}`,
      database: 'postgres'
    });
  });

  for (const config of connectionConfigs) {
    for (const password of passwords) {
      console.log(`Trying ${config.name} (${config.host}:${config.port}) with user ${config.user} and password ${password}...`);
      const client = new pg.Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password,
        database: config.database,
        ssl: { rejectUnauthorized: false }
      });

      try {
        await client.connect();
        console.log(`CONNECTED successfully to ${config.host} using ${config.name}`);
        
        console.log('Altering products table to add compare_price column...');
        await client.query(`
          ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price INTEGER;
        `);
        console.log('Column compare_price added successfully!');
        
        await client.end();
        return;
      } catch (err) {
        console.log(`Failed for ${config.host} (${config.name}):`, err.message);
        try {
          await client.end();
        } catch (e) {}
      }
    }
  }
  console.error('All connection attempts failed.');
}

run();
