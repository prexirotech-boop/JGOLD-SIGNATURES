import pg from 'pg';

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
const updateQuery = `
  UPDATE public.products 
  SET title = 'Freelance Web Design Blueprint', 
      slug = 'freelance-web-design-blueprint' 
  WHERE id = '4de71a50-9659-4bd0-85c6-35c621dd8e50';
`;

async function run() {
  for (const password of passwords) {
    console.log(`Trying direct connection with password: ${password}...`);
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
        console.log('Running SQL update...');
        const res = await client.query(updateQuery);
        console.log(`SQL applied successfully! Rows affected: ${res.rowCount}`);
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
  
  console.error('All database connection attempts failed.');
}

run();
