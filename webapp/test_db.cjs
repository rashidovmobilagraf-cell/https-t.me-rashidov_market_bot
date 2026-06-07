const { Client } = require('pg');

async function test() {
  const client = new Client({
    connectionString: 'postgres://postgres:BFJFMBFJFM19920509@@db.sbphcaletzugfqdvglmj.supabase.co:5432/postgres'
  });
  
  try {
     await client.connect();
     console.log('Direct connection successful!');
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
      CREATE TABLE IF NOT EXISTS carts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(store_id, user_id)
      );
     `);
     const addCol = async (table, col, def) => {
        try {
            await client.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def};`);
            console.log(`Added ${col} to ${table}`);
        } catch(e) {}
     };
     await addCol('products', 'variants', 'JSONB DEFAULT \'[]\'::jsonb');
     await addCol('orders', 'delivery_time', 'TEXT');
     await addCol('customers', 'referred_by', 'TEXT');
     console.log('Tables updated!');
  } catch(e) {
     console.error('Failed to connect or query:', e);
  } finally {
     await client.end().catch(()=>{});
     process.exit(0);
  }
}

test();
