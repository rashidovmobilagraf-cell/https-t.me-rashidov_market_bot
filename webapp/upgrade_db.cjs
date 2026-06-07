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
    console.log('Running schema upgrades...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          name TEXT,
          phone TEXT,
          balance NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(store_id, user_id)
      );
    `);
    console.log('Customers table created');

    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          code TEXT NOT NULL,
          discount NUMERIC NOT NULL,
          is_percent BOOLEAN DEFAULT true,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(store_id, code)
      );
    `);
    console.log('Promo_codes table created');

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

    await addCol('products', 'is_bestseller', 'BOOLEAN DEFAULT false');
    await addCol('stores', 'lat', 'NUMERIC');
    await addCol('stores', 'lon', 'NUMERIC');
    await addCol('stores', 'delivery_price', 'NUMERIC DEFAULT 500');
    await addCol('stores', 'card_number', 'TEXT');

    await client.query(`ALTER TABLE customers ENABLE ROW LEVEL SECURITY;`);
    await client.query(`ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;`);
    
    try { await client.query(`CREATE POLICY "Customers public" ON customers FOR ALL USING (true) WITH CHECK (true);`); } catch(e) {}
    try { await client.query(`CREATE POLICY "Promo_codes public" ON promo_codes FOR ALL USING (true) WITH CHECK (true);`); } catch(e) {}

    console.log('Database upgrade complete!');
  } catch (error) {
    console.error('Execution Error:', error);
  } finally {
    await client.end();
  }
}

run();
