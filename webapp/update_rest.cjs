const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stores?id=not.is.null`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ store_name: "YONMA YON MARKET" })
  });
  console.log('Status:', res.status);
  console.log('Text:', await res.text());
}
run();
