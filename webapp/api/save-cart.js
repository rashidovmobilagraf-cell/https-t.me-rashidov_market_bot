import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://sbphcaletzugfqdvglmj.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

export default async function handler(req, res) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { store_id, user_id, cart } = req.body;
    if (!store_id || !user_id) return res.status(400).json({ error: 'Missing store_id or user_id' });

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { error } = await supabase
            .from('carts')
            .upsert({ 
                store_id, 
                user_id, 
                items: cart, 
                updated_at: new Date().toISOString() 
            }, { onConflict: 'store_id, user_id' });
            
        if (error) throw error;
        return res.status(200).json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
