const fs = require('fs');
const { Client } = require('pg');

const regions = [
  'aws-0-eu-central-1.pooler.supabase.com',
  'aws-0-eu-west-1.pooler.supabase.com',
  'aws-0-eu-west-2.pooler.supabase.com',
  'aws-0-eu-west-3.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com'
];

const password = 'BFJFMBFJFM19920509@';
const user = 'postgres.sbphcaletzugfqdvglmj';

async function tryConnect(host) {
  const client = new Client({ host, port: 6543, user, password, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 });
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
    console.error('Failed to connect to any region.');
    return;
  }

  try {
    const sql = fs.readFileSync('upgrade_db_v4.sql', 'utf8');
    await client.query(sql);
    console.log('SQL executed successfully!');
    
    // Refresh schema cache
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log('Schema cache refreshed.');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
