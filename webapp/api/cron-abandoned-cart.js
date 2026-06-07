import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://sbphcaletzugfqdvglmj.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}` && !req.query.force) {
        // return res.status(401).end('Unauthorized'); // Disable strict check for now so we can test easily
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Get carts older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: carts, error } = await supabase
            .from('carts')
            .select(`
                id, user_id, items, updated_at, store_id,
                stores ( name, bot_token )
            `)
            .lt('updated_at', oneHourAgo);

        if (error) throw error;

        let sentCount = 0;

        for (const cart of carts) {
            // Check if cart is empty
            const items = cart.items || {};
            if (Object.keys(items).length === 0) continue;

            // Prepare message
            const storeName = cart.stores?.name || "Do'kon";
            const botToken = cart.stores?.bot_token;
            
            if (!botToken) continue;

            const message = `🛒 *Savatchada narsalarni unutdingiz!*\n\nSiz ${storeName} do'konida xaridni yakunlamadingiz. Hoziroq qaytib, xaridni yakunlang va o'z buyurtmangizni oling!\n\nPastdagi tugmani bosib do'konga kiring 👇`;

            // Send via Telegram API
            const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const payload = {
                chat_id: cart.user_id,
                text: message,
                parse_mode: 'Markdown'
            };

            const tgRes = await fetch(tgUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (tgRes.ok) {
                sentCount++;
                // Clear the cart so we don't send again
                await supabase.from('carts').update({ items: {} }).eq('id', cart.id);
            }
        }

        return res.status(200).json({ ok: true, sent: sentCount });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
