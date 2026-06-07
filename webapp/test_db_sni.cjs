const { Client } = require('pg');

async function run() {
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

  const tryConnect = async (host) => {
    const client = new Client({
      host,
      port: 5432,
      user: 'postgres.sbphcaletzugfqdvglmj', // or just postgres
      password: 'BFJFMBFJFM19920509@',
      database: 'postgres',
      ssl: { 
        rejectUnauthorized: false,
        servername: 'db.sbphcaletzugfqdvglmj.supabase.co'
      },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      return client;
    } catch (err) {
      await client.end().catch(() => {});
      throw err;
    }
  };

  try {
      const client = await Promise.any(regions.map(host => tryConnect(host)));
      console.log(`Successfully connected!`);
      const res = await client.query('SELECT 1 as x');
      console.log('Query result:', res.rows);
      await client.end();
  } catch (e) {
      console.error('Could not connect.', e);
  }
}

run();
