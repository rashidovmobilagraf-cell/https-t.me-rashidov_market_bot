// api/spin.js
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const { store_id, user_id, reward_amount } = req.body;
    if (!store_id || !user_id) return res.status(400).json({ error: "Missing params" });

    // 1. Fetch customer
    const userRes = await supabaseReq('GET', `customers?store_id=eq.${store_id}&user_id=eq.${user_id}`);
    if (!userRes || userRes.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = userRes[0];
    const lastSpin = customer.last_spin ? new Date(customer.last_spin) : null;
    const now = new Date();

    // Check if spun today (simple check: less than 12 hours ago for demo purposes, or check actual date)
    if (lastSpin) {
      const diffHours = (now - lastSpin) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return res.status(400).json({ error: "Siz bugun g'ildirakni o'ynagansiz! Ertaga yana urinib ko'ring." });
      }
    }

    // 2. Add reward to balance and update last_spin
    const newBal = parseFloat(customer.balance || 0) + parseFloat(reward_amount || 0);
    const updateRes = await supabaseReq('PATCH', `customers?id=eq.${customer.id}`, {
      balance: newBal,
      last_spin: now.toISOString()
    });

    return res.status(200).json({ ok: true, new_balance: newBal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal error" });
  }
}
