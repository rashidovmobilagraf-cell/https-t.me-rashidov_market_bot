export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Bot is active');
  }

  const update = req.body;
  if (!update) return res.status(200).json({ ok: true });

  const SUPABASE_URL = "https://sbphcaletzugfqdvglmj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR";
  
  async function supabaseReq(method, path, data = null) {
    const options = {
      method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    if (data) options.body = JSON.stringify(data);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, options);
    return await res.json();
  }

  try {
    const body = req.body || {};
    
    // 1. Admin Panel API call (from frontend)
    if (body.action === 'update_status') {
      const { orderId, newStatus, userId, storeId } = body;
      await supabaseReq('PATCH', `orders?order_id=eq.${orderId}`, { status: newStatus });
      
      // We need the bot token to send a message to the user!
      if (userId && storeId) {
         const stores = await supabaseReq('GET', `stores?id=eq.${storeId}`);
         if (stores && stores.length > 0) {
            const botToken = stores[0].bot_token;
            let statusText = "";
            if (newStatus === 'Yetkazilmoqda') statusText = `🚚 <b>Buyurtma #${orderId} yo'lga chiqdi!</b>\nTez orada yetkazib beriladi. Kuting!`;
            if (newStatus === 'Bajarildi') statusText = `✅ <b>Buyurtma #${orderId} yetkazib berildi!</b>\nXarid uchun rahmat. Yana kutib qolamiz!`;
            if (newStatus === 'Bekor qilingan') statusText = `❌ <b>Buyurtma #${orderId} bekor qilindi.</b>\nMa'lumot uchun admin bilan bog'laning.`;
            
            if (statusText) {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: userId, text: statusText, parse_mode: 'HTML' })
                });
            }
         }
      }
      return res.status(200).json({ ok: true });
    }

    // 2. Telegram Webhook parsing
    const botId = req.query.bot_id; // UUID of the store
    if (!botId) return res.status(200).json({ ok: true, error: "No bot_id provided" });

    // Fetch store info
    const stores = await supabaseReq('GET', `stores?id=eq.${botId}`);
    if (!stores || stores.length === 0) return res.status(200).json({ ok: true, error: "Store not found" });
    const store = stores[0];

    const BOT_TOKEN = store.bot_token;
    const ADMIN_ID = store.owner_id;
    const STORE_NAME = store.store_name;
    const WEBAPP_URL = `https://webapp-kohl-kappa.vercel.app/?store_id=${botId}&v=21`;

    const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}`;

    async function sendMsg(chatId, text, replyMarkup = null) {
      const b = { chat_id: chatId, text: text, parse_mode: 'HTML' };
      if (replyMarkup) b.reply_markup = replyMarkup;
      await fetch(`${tgUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b)
      });
    }

    async function answerCb(callbackQueryId, text = "") {
      await fetch(`${tgUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text })
      });
    }

    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || "";

      // Handle WebApp Data
      if (msg.web_app_data) {
        const data = JSON.parse(msg.web_app_data.data);
        const orderId = Math.random().toString(16).slice(2, 10).toUpperCase();
        const orderData = {
          order_id: orderId,
          user_id: msg.from.id,
          store_id: botId,
          items: data.items || [],
          total: data.total || data.total_price || 0,
          delivery_type: data.deliveryType || "delivery",
          payment_type: data.paymentType || "cash",
          address: data.address || {},
          comment: data.comment || "",
          status: "Yangi",
          date: new Date().toISOString()
        };
        await supabaseReq('POST', 'orders', orderData);

        // Mantiq: Sotib olingan mahsulotlar sonini ayirish
        if (data.items && data.items.length > 0) {
          for (const item of data.items) {
            try {
              const prodRes = await supabaseReq('GET', `products?id=eq.${item.id}`);
              if (prodRes && prodRes.length > 0) {
                const product = prodRes[0];
                if (product.category && product.category.includes('||QTY:')) {
                  const parts = product.category.split('||QTY:');
                  const catName = parts[0];
                  let currentQty = parseInt(parts[1], 10);
                  if (!isNaN(currentQty)) {
                    currentQty = Math.max(0, currentQty - (item.quantity || 1));
                    const newCategory = `${catName}||QTY:${currentQty}`;
                    await supabaseReq('PATCH', `products?id=eq.${item.id}`, { category: newCategory });
                  }
                }
              }
            } catch (e) {}
          }
        }

        await sendMsg(chatId, `✅ <b>${STORE_NAME} - Buyurtma qabul qilindi!</b>\nBuyurtma raqami: #${orderId}\nTez orada siz bilan bog'lanamiz.`);

        // Notify Admin
        const addr = data.address || {};
        let addressStr = `🏠 Uy: ${addr.house || ''}\n🚪 Kvartira: ${addr.apt || ''}\n🔑 Kod: ${addr.code || ''}\n📞 Tel: ${addr.phone || ''}`;
        let itemsStr = data.items.map(i => `- ${i.name} x${i.quantity} = ${(i.price * i.quantity).toLocaleString()} so'm`).join('\n');
        
        const adminMsg = `🛍 <b>Yangi buyurtma! (#${orderId})</b>\n🏪 Do'kon: ${STORE_NAME}\n\n👤 Mijoz: ${data.user_name || msg.from.first_name} (@${msg.from.username || 'yoq'})\n📞 Tel: ${addr.phone || 'Noma\'lum'}\n\n${itemsStr}\n\n🚚 Yetkazish: ${data.deliveryType === 'delivery' ? 'Yetkazib berish' : 'Olib ketish'}\n💵 To'lov: ${data.paymentType}\n\n${addressStr}\n\n📝 Izoh: ${data.comment || "Yo'q"}\n\n💰 Umumiy summa: ${(data.total || data.total_price || 0).toLocaleString()} so'm`;
        
        await sendMsg(ADMIN_ID, adminMsg);
        
        if (addr.lat && addr.lon) {
           await fetch(`${tgUrl}/sendLocation`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ chat_id: ADMIN_ID, latitude: addr.lat, longitude: addr.lon })
           });
        }
        return res.status(200).json({ ok: true });
      }

      if (text === '/start') {
        const markup = {
          inline_keyboard: [
            [{ text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" }, { text: "🇷🇺 Русский", callback_data: "lang_ru" }]
          ]
        };
        await sendMsg(chatId, `Assalomu alaykum! <b>${STORE_NAME}</b> do'konining botiga xush kelibsiz.\nTilni tanlang / Выберите язык:`, markup);
      } 
      else if (text === '/id') {
        await sendMsg(chatId, `Sizning Telegram ID raqamingiz:\n\n<b>${chatId}</b>\n\nShu raqamni nusxalab, menga yuboring!`);
      }
      else if (text === '/admin') {
        if (chatId.toString() !== ADMIN_ID.toString()) {
          await sendMsg(chatId, "Boshqaruv paneliga kirishga ruxsat yo'q.");
          return res.status(200).json({ ok: true });
        }
        const markup = {
          inline_keyboard: [[{ text: "⚙️ Boshqaruv Paneli", web_app: { url: `https://webapp-kohl-kappa.vercel.app/admin-panel?store_id=${botId}&v=4` } }]]
        };
        await sendMsg(chatId, `<b>${STORE_NAME}</b> admin paneliga xush kelibsiz:`, markup);
      }
      else if (text.startsWith('/newbot ')) {
        if (chatId.toString() !== ADMIN_ID.toString()) return res.status(200).json({ ok: true });
        const parts = text.split(' ');
        if (parts.length < 3) {
            await sendMsg(chatId, "❌ Xato format! To'g'ri format:\n/newbot BOT_TOKEN Do'kon Nomi\nMisol:\n`/newbot 1234:ABC Mening Do'konim`");
            return res.status(200).json({ ok: true });
        }
        const newToken = parts[1];
        const newName = parts.slice(2).join(' ');
        
        await sendMsg(chatId, `⏳ Yangi do'kon yaratilmoqda: <b>${newName}</b>...`);
        
        const storeData = { bot_token: newToken, owner_id: chatId.toString(), store_name: newName };
        const sRes = await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify(storeData)
        });
        
        if (!sRes.ok) {
            await sendMsg(chatId, "❌ Xatolik: Bu token allaqachon ro'yxatdan o'tgan bo'lishi mumkin.");
            return res.status(200).json({ ok: true });
        }
        const data = await sRes.json();
        
        if (data && data.length > 0) {
            const newBotId = data[0].id;
            const newWebhookUrl = `https://webapp-kohl-kappa.vercel.app/api/webhook?bot_id=${newBotId}`;
            const tgWbRes = await fetch(`https://api.telegram.org/bot${newToken}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newWebhookUrl })
            });
            const tgWbData = await tgWbRes.json();
            
            if (tgWbData.ok) {
                await sendMsg(chatId, `✅ <b>Muvaffaqiyatli!</b>\nYangi do'kon: ${newName}\n\nYangi botingiz tayyor va ishlamoqda! Admin panelga kirish uchun o'sha yangi botga kiring va <b>/admin</b> deb yozing.`);
            } else {
                await sendMsg(chatId, `⚠️ Do'kon yaratildi, lekin botga ulanishda xatolik:\n${tgWbData.description}`);
            }
        }
      }
      else if (text === "📞 Bog'lanish" || text === "📞 Контакты") {
        await sendMsg(chatId, `📞 <b>${STORE_NAME}</b> bilan bog'lanish uchun bot adminiga yozing! (Shu botga to'g'ridan-to'g'ri yozsangiz admin o'qiydi)`);
      }
      else if (text === "📦 Buyurtmalarim" || text === "📦 Мои заказы") {
        const orders = await supabaseReq('GET', `orders?user_id=eq.${chatId}&store_id=eq.${botId}&order=date.desc`);
        if (!orders || orders.length === 0) {
          await sendMsg(chatId, "Sizda hali buyurtmalar yo'q.");
        } else {
          for (const order of orders.slice(0, 5)) {
            let info = `📦 <b>Buyurtma #${order.order_id}</b>\nHolati: ${order.status}\nSana: ${new Date(order.date).toLocaleString('uz-UZ')}\n\n`;
            order.items?.forEach(item => {
              info += `- ${item.name} x${item.quantity || item.qty}\n`;
            });
            info += `\n💰 Jami: ${(order.total || 0).toLocaleString()} so'm`;
            await sendMsg(chatId, info);
          }
        }
      }
      else if (text === "✍️ Ma'lumotlarni o'zgartirish" || text === "✍️ Изменить данные") {
        await sendMsg(chatId, "Bu funksiya tez orada ishga tushadi.");
      }
      else {
        // --- LIVE CHAT LOGIC ---
        // 1. Admin responding to a user
        if (chatId.toString() === ADMIN_ID.toString() && msg.reply_to_message) {
          let targetId = null;
          if (msg.reply_to_message.text) {
            const match = msg.reply_to_message.text.match(/\[ID:(\d+)\]/);
            if (match) targetId = match[1];
          } else if (msg.reply_to_message.caption) {
            const match = msg.reply_to_message.caption.match(/\[ID:(\d+)\]/);
            if (match) targetId = match[1];
          }
          
          if (targetId) {
            if (text) {
              await sendMsg(targetId, `👨‍💻 <b>Admin (${STORE_NAME}):</b>\n${text}`);
            } else {
              // Copy photo/voice from admin to user
              await fetch(`${tgUrl}/copyMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: targetId, from_chat_id: ADMIN_ID, message_id: msg.message_id })
              });
            }
            return res.status(200).json({ ok: true });
          }
        }

        // 2. User sending message to Admin
        if (chatId.toString() !== ADMIN_ID.toString() && !msg.web_app_data) {
          if (text && !text.startsWith('/')) {
            await sendMsg(ADMIN_ID, `💬 <b>Mijozdan xabar (${STORE_NAME}):</b>\n[ID:${chatId}] (@${msg.from.username || 'yoq'})\n\n${text}`);
          } else if (!text) {
            // It's a photo, voice, video, etc.
            await fetch(`${tgUrl}/copyMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                chat_id: ADMIN_ID, 
                from_chat_id: chatId, 
                message_id: msg.message_id,
                caption: `[ID:${chatId}] (@${msg.from.username || 'yoq'})\n` + (msg.caption || '')
              })
            });
          }
        }
      }
    } 
    else if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;

      if (data.startsWith('lang_')) {
        const lang = data.split('_')[1];
        await answerCb(cb.id, lang === 'uz' ? "Til tanlandi" : "Язык выбран");
        
        const text = lang === 'uz' ? "Xush kelibsiz! Buyurtma berish uchun tugmani bosing." : "Добро пожаловать! Нажмите кнопку чтобы сделать заказ.";
        const markup = {
          keyboard: [
            [{ text: lang === 'uz' ? `🛒 ${STORE_NAME} - Buyurtma berish` : `🛒 ${STORE_NAME} - Заказать`, web_app: { url: WEBAPP_URL } }],
            [{ text: lang === 'uz' ? "📦 Buyurtmalarim" : "📦 Мои заказы" }, { text: lang === 'uz' ? "📞 Bog'lanish" : "📞 Контакты" }],
            [{ text: lang === 'uz' ? "✍️ Ma'lumotlarni o'zgartirish" : "✍️ Изменить данные" }]
          ],
          resize_keyboard: true
        };
        await sendMsg(chatId, text, markup);
      }
    }
  } catch (error) {
    console.error("Webhook error:", error);
  }

  res.status(200).json({ ok: true });
}
