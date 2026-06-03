const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";
const STORE_ID = "d5558705-d912-4810-87ba-3769556683f1";

const catalog = [
  { name: "Gamburger Classic", price: "25000", category: "Fast Food", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60" }
];

async function run() {
  for (let p of catalog) {
    p.store_id = STORE_ID;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(p)
    });
    console.log(`Added ${p.name}:`, res.status, await res.text());
  }
}

run();
