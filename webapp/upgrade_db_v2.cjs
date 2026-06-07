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
    connectionTimeoutMillis: 15000
  });

  try {
    await client.connect();
    console.log(`Successfully connected to ${host}`);
    return client;
  } catch (err) {
    await client.end().catch(() => {});
    return null;
  }
}

async function run() {
  let client = null;
  for (const host of regions) {
    client = await tryConnect(host);
    if (client) break;
  }

  if (!client) {
    console.error('Could not connect to Supabase.');
    return;
  }

  try {
    console.log('Running schema upgrades v2...');
    
    // Create reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          user_name TEXT,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('Reviews table created');

    // Create carts table for abandoned carts
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(store_id, user_id)
      );
    `);
    console.log('Carts table created');

    const addCol = async (table, col, def) => {
        try {
            await client.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
            console.log(`Added ${col} to ${table}`);
        } catch(e) {
            if (e.message.includes('already exists')) {
                console.log(`${col} already exists in ${table}`);
            } else {
                console.log(`Error adding ${col}: ${e.message}`);
            }
        }
    };

    await addCol('products', 'variants', 'JSONB DEFAULT \'[]\'::jsonb');
    await addCol('orders', 'delivery_time', 'TEXT');
    await addCol('customers', 'referred_by', 'TEXT');

    await client.query(`ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE carts ENABLE ROW LEVEL SECURITY;`);
    
    try { await client.query(`CREATE POLICY "Reviews public" ON reviews FOR ALL USING (true) WITH CHECK (true);`); } catch(e) {}
    try { await client.query(`CREATE POLICY "Carts public" ON carts FOR ALL USING (true) WITH CHECK (true);`); } catch(e) {}

    console.log('Database upgrade v2 complete!');
  } catch (error) {
    console.error('Execution Error:', error);
  } finally {
    await client.end();
  }
}

run();
