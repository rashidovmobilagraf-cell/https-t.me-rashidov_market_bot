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
    await client.query("UPDATE stores SET store_name = 'YONMA YON MARKET'");
    console.log('Store name updated!');
  } catch (error) {
    console.error('Execution Error:', error);
  } finally {
    await client.end();
  }
}

run();
