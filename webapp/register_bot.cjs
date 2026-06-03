const BOT_TOKEN = "8851646340:AAFc4eKPoOP9mV_2z0WcBctdj3cKe6NHwOQ";
const ADMIN_ID = "7899711439";
const STORE_NAME = "Rashidov Market";
const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

async function run() {
  console.log("Registering store...");
  
  // 1. Insert into stores
  const storeData = {
    bot_token: BOT_TOKEN,
    owner_id: ADMIN_ID,
    store_name: STORE_NAME
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(storeData)
  });

  const data = await res.json();
  if (!res.ok) {
     if (data.code === '23505') { // Unique violation
        console.log("Store already exists. Fetching id...");
        const getRes = await fetch(`${SUPABASE_URL}/rest/v1/stores?bot_token=eq.${BOT_TOKEN}&select=*`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const getData = await getRes.json();
        if (getData && getData.length > 0) {
            await setWebhook(getData[0].id);
        }
     } else {
        console.error("Failed to insert store:", data);
     }
     return;
  }

  const storeId = data[0].id;
  console.log("Store created with ID:", storeId);
  
  await setWebhook(storeId);
}

async function setWebhook(storeId) {
    const WEBHOOK_URL = `https://webapp-kohl-kappa.vercel.app/api/webhook?bot_id=${storeId}`;
    console.log("Setting webhook to:", WEBHOOK_URL);
    
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: WEBHOOK_URL })
    });
    const tgData = await tgRes.json();
    console.log("Webhook response:", tgData);
}

run();
