const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

fetch(`${SUPABASE_URL}/rest/v1/banners?select=*`, {
  headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
})
.then(r=>r.json())
.then(data => {
   console.log(data);
})
.catch(console.error);
