import { Bot, webhookCallback } from 'grammy';
import { prisma } from '@/lib/prisma';

const bot = new Bot(process.env.BOT_TOKEN || 'MOCK_TOKEN');

// Basic webhook logic
bot.command('start', async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) }
  });

  if (user && user.phone) {
    // User exists
    await ctx.reply(`👋 Qaytganingiz bilan, ${user.name}!\n\n🛒 *Rashidov Market* do'konimizga xush kelibsiz!`, {
      parse_mode: 'Markdown',
      reply_markup: {
        keyboard: [
          [{ text: "🛍️ Do'konni ochish", web_app: { url: process.env.WEBAPP_URL || 'https://rashidov-market-webapp.vercel.app' } }],
          [{ text: "✍️ Ma'lumotlarni o'zgartirish" }]
        ],
        resize_keyboard: true
      }
    });
  } else {
    // New user
    await ctx.reply("🌐 Vyberite yazik sistemi / Tizim tilini tanlang:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" }, { text: "🇷🇺 Русский", callback_data: "lang_ru" }]
        ]
      }
    });
  }
});

bot.callbackQuery(/^lang_(uz|ru)$/, async (ctx) => {
  const lang = ctx.match[1];
  const telegramId = ctx.from.id;

  await prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: { lang, name: ctx.from.first_name },
    create: { telegramId: BigInt(telegramId), lang, name: ctx.from.first_name }
  });

  await ctx.answerCallbackQuery();

  const msgText = lang === 'uz' ? "Iltimos, ro'yxatdan o'tish uchun telefon raqamingizni yuboring:" : "Пожалуйста, отправьте свой номер телефона для регистрации:";
  
  await ctx.reply(msgText, {
    reply_markup: {
      keyboard: [
        [{ text: lang === 'uz' ? "📱 Raqamni yuborish" : "📱 Отправить номер", request_contact: true }]
      ],
      resize_keyboard: true
    }
  });
});

bot.on('message:contact', async (ctx) => {
  const telegramId = ctx.from.id;
  const contact = ctx.message.contact;

  const user = await prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data: { phone: contact.phone_number, name: contact.first_name }
  });

  const lang = user.lang;
  const welcomeText = lang === 'uz' ? "🎉 Ro'yxatdan muvaffaqiyatli o'tdingiz! Quyidagi tugma orqali do'konni oching:" : "🎉 Вы успешно зарегистрировались! Откройте магазин по кнопке ниже:";

  await ctx.reply(welcomeText, {
    reply_markup: {
      keyboard: [
        [{ text: lang === 'uz' ? "🛍️ Do'konni ochish" : "🛍️ Открыть магазин", web_app: { url: process.env.WEBAPP_URL || 'https://rashidov-market-webapp.vercel.app' } }],
        [{ text: lang === 'uz' ? "✍️ Ma'lumotlarni o'zgartirish" : "✍️ Изменить данные" }]
      ],
      resize_keyboard: true
    }
  });
});

export const POST = webhookCallback(bot, 'std/http');
