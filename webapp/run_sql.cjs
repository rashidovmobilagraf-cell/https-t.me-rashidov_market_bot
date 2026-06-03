const { Client } = require('pg');

const regions = [
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com',
  'aws-0-us-east-2.pooler.supabase.com',
  'aws-0-us-west-1.pooler.supabase.com',
  'aws-0-us-west-2.pooler.supabase.com',
  'aws-0-ap-southeast-1.pooler.supabase.com',
  'aws-0-ap-south-1.pooler.supabase.com',
  'aws-0-ap-northeast-1.pooler.supabase.com',
  'aws-0-ap-northeast-2.pooler.supabase.com',
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-0-ca-central-1.pooler.supabase.com'
];

const password = 'BFJFMBFJFM19920509@';
const user = 'postgres.sbphcaletzugfqdvglmj';

async function tryConnect(host) {
  const client = new Client({
    host,
    port: 6543,
    user,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`Successfully connected to ${host}`);
    return client;
  } catch (err) {
    console.log(`Failed ${host}: ${err.message}`);
    await client.end().catch(() => {});
    return null;
  }
}

async function run() {
  let client = null;
  for (const host of regions) {
    console.log(`Trying ${host}...`);
    client = await tryConnect(host);
    if (client) break;
  }

  if (!client) {
    console.error('Could not connect to any known Supabase pooler region.');
    return;
  }

  try {
    console.log('Running SQL...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          bot_token TEXT UNIQUE NOT NULL,
          bot_username TEXT,
          owner_id TEXT NOT NULL,
          store_name TEXT NOT NULL,
          theme_color TEXT DEFAULT '#0088cc',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Stores table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          price NUMERIC NOT NULL,
          image_url TEXT,
          category TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Products table created');

    try {
      await client.query(`ALTER TABLE orders ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;`);
      console.log('Orders table altered');
    } catch (e) {
      console.log('Alter orders message:', e.message);
    }

    await client.query(`ALTER TABLE stores ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE products ENABLE ROW LEVEL SECURITY;`);
    
    try { await client.query(`CREATE POLICY "Stores public" ON stores FOR ALL USING (true) WITH CHECK (true);`); } catch(e) {}
    try { await client.query(`CREATE POLICY "Products public" ON products FOR ALL USING (true) WITH CHECK (true);`); } catch(e) {}
    
    console.log('All Done!');
  } catch (error) {
    console.error('Execution Error:', error);
  } finally {
    await client.end();
  }
}

run();
