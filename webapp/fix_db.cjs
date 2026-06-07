const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.27ff52ab-de69-4ca6-b535-d2a1d141508d`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ store_name: "YONMA YON MARKET" })
  });
  console.log('Status:', res.status);
}
run();
