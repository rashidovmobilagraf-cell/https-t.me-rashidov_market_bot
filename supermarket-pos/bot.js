const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOKEN = "8870579743:AAEdthy1BtGhtZMk6GrFQCBzPXfTSgEwL_4";
const API_URL = `https://api.telegram.org/bot${TOKEN}`;

let lastUpdateId = 0;

async function getUpdates() {
  try {
    const res = await fetch(`${API_URL}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    const data = await res.json();
    
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        await handleUpdate(update);
      }
    }
  } catch (error) {
    console.error("Error fetching updates:", error.message);
  }
}

async function sendMessage(chatId, text, replyMarkup = null) {
  try {
    const body = { chat_id: chatId, text, parse_mode: 'HTML' };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    
    await fetch(`${API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    console.error("Error sending message:", error.message);
  }
}

async function handleUpdate(update) {
  const message = update.message;
  if (!message) return;
  
  const chatId = message.chat.id;
  
  // 1. Handling /start
  if (message.text === '/start') {
    const opts = {
      keyboard: [
        [{ text: "📞 Raqamni yuborish (Ro'yxatdan o'tish)", request_contact: true }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
    await sendMessage(chatId, "Assalomu alaykum! <b>Rashidov Market</b> botiga xush kelibsiz.\nIltimos, chegirmalar va yangiliklardan xabardor bo'lish uchun telefon raqamingizni yuboring (tugmani bosing).", opts);
    return;
  }
  
  // 2. Handling Contact sharing
  if (message.contact) {
    let phone = message.contact.phone_number;
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }
    
    // Find customer in db by phone (exact or ending with)
    // Sometimes phones have +, sometimes not
    const customers = await prisma.customer.findMany();
    const customer = customers.find(c => 
      c.phone && (c.phone === phone || c.phone.replace('+','') === phone.replace('+',''))
    );
    
    if (customer) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { telegramChatId: String(chatId) }
      });
      await sendMessage(chatId, `Ajoyib, ${customer.name}! Siz muvaffaqiyatli ro'yxatdan o'tdingiz. Endi xaridlar va chegirmalar haqida xabardor bo'lib turasiz 🎉`, { remove_keyboard: true });
    } else {
      await sendMessage(chatId, "Kechirasiz, sizning raqamingiz do'konimiz bazasidan topilmadi. Avval kassada ro'yxatdan o'ting.", { remove_keyboard: true });
    }
    return;
  }
}

// Start polling
console.log("Telegram Bot ishga tushdi...");
setInterval(getUpdates, 2000);
