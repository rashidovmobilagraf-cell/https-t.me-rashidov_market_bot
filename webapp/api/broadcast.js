// api/broadcast.js
const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co/rest/v1";
const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

async function supabaseReq(method, path, body = null) {
  const options = {
    method,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/${path}`, options);
  return await res.json();
}

async function sendMsg(tgUrl, chatId, text, imageUrl = null) {
  try {
    if (imageUrl) {
      await fetch(`${tgUrl}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo: imageUrl, caption: text, parse_mode: 'HTML' })
      });
    } else {
      await fetch(`${tgUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
      });
    }
  } catch (e) {}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { store_id, text, image_url, admin_id } = req.body;
    if (!store_id || !text || !admin_id) return res.status(400).json({ error: "Missing params" });

    // 1. Verify Admin
    const stores = await supabaseReq('GET', `stores?id=eq.${store_id}`);
    if (!stores || stores.length === 0) return res.status(404).json({ error: "Store not found" });
    const store = stores[0];
    
    // Only owner can send broadcast
    if (store.owner_id != admin_id) {
        return res.status(403).json({ error: "Faqat admin yubora oladi" });
    }

    const tgUrl = `https://api.telegram.org/bot${store.bot_token}`;

    // 2. Fetch all customers of this store
    // Note: for very large sets, this should be done in batches via a queue. For now, simple loop.
    const customers = await supabaseReq('GET', `customers?store_id=eq.${store_id}&select=user_id`);
    if (!customers || customers.length === 0) {
      return res.status(200).json({ ok: true, sent: 0 });
    }

    // 3. Send messages
    let sentCount = 0;
    for (const c of customers) {
       await sendMsg(tgUrl, c.user_id, text, image_url);
       sentCount++;
       // sleep a bit to avoid hitting telegram rate limits
       await new Promise(r => setTimeout(r, 50)); 
    }

    return res.status(200).json({ ok: true, sent: sentCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
