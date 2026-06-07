const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

async function run() {
  const storesRes = await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const stores = await storesRes.json();
  console.log("STORES:", stores.map(s => ({ id: s.id, name: s.store_name })));

  const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,store_id`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const products = await prodRes.json();
  console.log("PRODUCTS:", products.length);
  if (products.length > 0) {
    console.log("First product store_id:", products[0].store_id);
  }
}
run();
