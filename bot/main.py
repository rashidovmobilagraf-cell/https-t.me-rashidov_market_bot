import os
import json
import logging
import asyncio
import uuid
import aiohttp
from dotenv import load_dotenv
from aiohttp import web
import aiohttp_cors

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Load environment variables
load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://31417e63b58fab.lhr.life")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0")) if os.getenv("ADMIN_ID", "0").isdigit() else 0

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://sbphcaletzugfqdvglmj.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_IAuMWgn3q4VLD-bD3OwbDw_3Y4yTKpR")

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

app = Application.builder().token(BOT_TOKEN).build()

# --- Supabase Helper Functions ---
async def supabase_request(method, endpoint, json_data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    async with aiohttp.ClientSession() as session:
        if method == "GET":
            async with session.get(url, headers=SUPABASE_HEADERS) as resp:
                return await resp.json()
        elif method == "POST":
            async with session.post(url, headers=SUPABASE_HEADERS, json=json_data) as resp:
                return await resp.json()
        elif method == "PATCH":
            async with session.patch(url, headers=SUPABASE_HEADERS, json=json_data) as resp:
                return await resp.json()
        elif method == "DELETE":
            async with session.delete(url, headers=SUPABASE_HEADERS) as resp:
                if resp.status == 204:
                    return []
                return await resp.json()

async def get_user(user_id):
    res = await supabase_request("GET", f"users?telegram_id=eq.{user_id}&select=*")
    if res and isinstance(res, list) and len(res) > 0:
        return res[0]
    return None

async def upsert_user(user_data):
    headers = SUPABASE_HEADERS.copy()
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    url = f"{SUPABASE_URL}/rest/v1/users"
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=user_data) as resp:
            return await resp.json()

def get_main_keyboard(lang: str = "uz"):
    order_text = "🛒 Buyurtma berish" if lang == "uz" else "🛒 Сделать заказ"
    orders_text = "📦 Buyurtmalarim" if lang == "uz" else "📦 Мои заказы"
    contact_text = "📞 Bog'lanish" if lang == "uz" else "📞 Контакты"
    settings_text = "✍️ Ma'lumotlarni o'zgartirish" if lang == "uz" else "✍️ Изменить данные"
    
    return ReplyKeyboardMarkup(
        [
            [KeyboardButton(text=order_text, web_app=WebAppInfo(url=WEBAPP_URL))],
            [KeyboardButton(text=orders_text), KeyboardButton(text=contact_text)],
            [KeyboardButton(text=settings_text)]
        ],
        resize_keyboard=True
    )

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user = await get_user(user_id)
    if user and user.get("phone"):
        name = user.get("name", "Mijoz")
        lang = user.get("lang", "uz")
        await update.message.reply_text(
            f"👋 Qaytganingiz bilan, {name}!\n\n🛒 *Rashidov Market* do'konimizga xush kelibsiz!",
            reply_markup=get_main_keyboard(lang),
            parse_mode="Markdown",
        )
    else:
        keyboard = [
            [InlineKeyboardButton("🇺🇿 O'zbekcha", callback_data="lang_uz")],
            [InlineKeyboardButton("🇷🇺 Русский", callback_data="lang_ru")],
        ]
        await update.message.reply_text(
            "🌐 Vyberite yazik sistemi / Tizim tilini tanlang:",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

async def language_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    lang = query.data.split("_")[1]
    user_id = query.from_user.id
    name = query.from_user.first_name
    
    await upsert_user({
        "telegram_id": user_id,
        "lang": lang,
        "name": name,
        "phone": ""
    })
    
    phone_button = KeyboardButton(text="📱 Raqamni yuborish", request_contact=True)
    reply_markup = ReplyKeyboardMarkup([[phone_button]], resize_keyboard=True, one_time_keyboard=True)
    msg_text = (
        "Iltimos, ro'yxatdan o'tish uchun telefon raqamingizni yuboring:" if lang == "uz" 
        else "Пожалуйста, отправьте свой номер телефона для регистрации:"
    )
    await query.message.reply_text(msg_text, reply_markup=reply_markup)

async def contact_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    contact = update.message.contact
    
    user = await get_user(user_id)
    lang = user.get("lang", "uz") if user else "uz"
    
    await upsert_user({
        "telegram_id": user_id,
        "lang": lang,
        "name": contact.first_name,
        "phone": contact.phone_number
    })
    
    welcome_text = (
        "🎉 Ro'yxatdan muvaffaqiyatli o'tdingiz! O'zingizga kerakli bo'limni tanlang:" if lang == "uz" else
        "🎉 Вы успешно зарегистрировались! Выберите нужный раздел:"
    )
    await update.message.reply_text(welcome_text, reply_markup=get_main_keyboard(lang))

async def webapp_data_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    try:
        data = json.loads(update.message.web_app_data.data)
        if data.get('action') == 'checkout':
            import datetime
            items = data.get('items', [])
            total = data.get('total', 0)
            delivery_type = data.get('deliveryType', 'delivery')
            payment_type = data.get('paymentType', 'cash')
            address = data.get('address', {})
            comment = data.get('comment', '')
            user_id = update.effective_user.id
            
            order_id = str(uuid.uuid4())[:8].upper()
            
            new_order = {
                "order_id": order_id,
                "user_id": user_id,
                "items": items,
                "total": total,
                "delivery_type": delivery_type,
                "payment_type": payment_type,
                "address": address,
                "comment": comment,
                "status": "Kutilmoqda",
                "date": datetime.datetime.now().isoformat()
            }
            
            await supabase_request("POST", "orders", json_data=new_order)
            
            receipt = f"🧾 *Buyurtma #{order_id}*\n\n"
            for i, item in enumerate(items, 1):
                receipt += f"{i}. {item['name']} - {item.get('qty', 1)} x {item['price']} so'm\n"
            receipt += f"\n💰 *Jami:* {total:,.0f} so'm\n"
            receipt += f"🚚 *Yetkazib berish:* {'Yetkazib berish' if delivery_type == 'delivery' else 'Samovoz'}\n"
            receipt += f"💳 *To'lov usuli:* {payment_type.capitalize()}\n"
            if address.get('phone'):
                receipt += f"📞 *Telefon:* {address.get('phone')}\n"
            if delivery_type == 'delivery':
                receipt += f"📍 *Manzil:* Uy:{address.get('house', '')} Kv:{address.get('apt', '')} Kod:{address.get('code', '')}\n"
            if comment:
                receipt += f"📝 *Izoh:* {comment}\n"
                
            if payment_type in ['click', 'payme']:
                receipt += "\n💳 *To'lov uchun karta raqami:*\n`8600 0000 0000 0000` (Eshmatov Toshmat)\nIltimos, to'lovni amalga oshirgach 'To'ladim' tugmasini bosing."
                keyboard = [
                    [InlineKeyboardButton("✅ To'ladim", callback_data=f"pay_{order_id}")],
                    [InlineKeyboardButton("❌ Bekor qilish", callback_data=f"cancel_{order_id}")]
                ]
            else:
                receipt += "\n✅ Buyurtmangiz qabul qilindi! Tez orada siz bilan bog'lanamiz."
                keyboard = [
                    [InlineKeyboardButton("❌ Bekor qilish", callback_data=f"cancel_{order_id}")]
                ]
                
            await update.message.reply_text(receipt, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
            
            if ADMIN_ID != 0:
                admin_keyboard = [
                    [InlineKeyboardButton("✅ Qabul qilish", callback_data=f"admin_accept_{order_id}"),
                     InlineKeyboardButton("❌ Bekor qilish", callback_data=f"admin_reject_{order_id}")]
                ]
                await context.bot.send_message(
                    chat_id=ADMIN_ID,
                    text=f"🔔 *YANGI BUYURTMA!*\n\n{receipt}",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup(admin_keyboard)
                )
    except Exception as e:
        logging.error(f"Error parsing webapp data: {e}")
        await update.message.reply_text("Kechirasiz, buyurtmani qabul qilishda xatolik yuz berdi.")

async def order_action_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    parts = query.data.split("_")
    action = parts[0]
    order_id = parts[1]
    
    orders = await supabase_request("GET", f"orders?order_id=eq.{order_id}&select=*")
    if not orders or len(orders) == 0:
        await query.edit_message_text("Buyurtma topilmadi yoki eskirgan.")
        return
        
    if action == "cancel":
        await supabase_request("PATCH", f"orders?order_id=eq.{order_id}", json_data={"status": "Bekor qilingan"})
        await query.edit_message_text(f"❌ Buyurtma #{order_id} bekor qilindi.")
    elif action == "pay":
        await supabase_request("PATCH", f"orders?order_id=eq.{order_id}", json_data={"status": "To'langan (Tasdiqlanmoqda)"})
        await query.edit_message_text(f"✅ Buyurtma #{order_id} uchun to'lov qildingiz. Admin tasdiqlashi kutilmoqda.")
        
        if ADMIN_ID != 0:
            await context.bot.send_message(
                chat_id=ADMIN_ID,
                text=f"💳 *MIJOZ TO'LOV QILDI!*\nBuyurtma: #{order_id}\nIltimos kartangizni tekshiring.",
                parse_mode="Markdown"
            )

async def buy_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer("Savatga qo'shildi! (Hozircha test rejimida)", show_alert=True)

async def my_orders_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_orders = await supabase_request("GET", f"orders?user_id=eq.{user_id}&select=*")
    
    if not user_orders:
        await update.message.reply_text("📦 Hali hech qanday buyurtma qilmadingiz.")
        return
        
    text = "📦 *Sizning buyurtmalaringiz:*\n\n"
    # Show last 5 orders
    for o in reversed(user_orders[-5:]):
        text += f"🔖 *#{o['order_id']}* - {o['total']} so'm\n"
        text += f"Holati: _{o['status']}_\n"
        text += f"Sana: {o.get('date', '')[:10]}\n\n"
        
    await update.message.reply_text(text, parse_mode="Markdown")

async def contact_us_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("📞 Biz bilan bog'lanish:\nTelegram: @rashidov_no1\n@fuudmarket\nTel: +998904644353")

async def settings_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user = await get_user(user_id)
    lang = user.get("lang", "uz") if user else "uz"
    keyboard = [
        [InlineKeyboardButton("✏️ Ismni o'zgartirish" if lang == "uz" else "✏️ Изменить имя", callback_data="edit_name")],
        [InlineKeyboardButton("📱 Telefonni o'zgartirish" if lang == "uz" else "📱 Изменить телефон", callback_data="edit_phone")],
    ]
    text = "Nimani o'zgartirmoqchisiz?" if lang == "uz" else "Что вы хотите изменить?"
    await update.message.reply_text(text, reply_markup=InlineKeyboardMarkup(keyboard))

async def edit_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    await query.edit_message_text("Bu funksiya hozircha implementatsiya qilinmagan. Keyingi versiyada qo'shiladi.")

async def admin_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if ADMIN_ID != 0 and user_id != ADMIN_ID:
        await update.message.reply_text("Siz admin emassiz!")
        return
        
    webapp_url = f"{WEBAPP_URL}/admin-panel"
    keyboard = [[InlineKeyboardButton("⚙️ Boshqaruv Paneli (Web)", web_app=WebAppInfo(url=webapp_url))]]
    await update.message.reply_text(
        "Boshqaruv paneliga xush kelibsiz! Barcha mahsulotlarni sayt orqali tahrirlash uchun quyidagi tugmani bosing:",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )

# --- aiohttp Web API (Admin Panel Proxy to Supabase) ---
async def api_get_products(request):
    res = await supabase_request("GET", "products?select=*")
    return web.json_response(res)

async def api_add_product(request):
    try:
        data = await request.json()
        import time
        new_product = {
            "id": data.get("id") or str(int(time.time())),
            "name": data.get("name", "Yangi mahsulot"),
            "price": str(data.get("price", "0")),
            "category": data.get("category", "Boshqa"),
            "image": data.get("image", "https://picsum.photos/300")
        }
        res = await supabase_request("POST", "products", json_data=new_product)
        return web.json_response({"success": True, "product": new_product})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)}, status=500)

async def api_delete_product(request):
    try:
        p_id = request.match_info.get("id")
        await supabase_request("DELETE", f"products?id=eq.{p_id}")
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)}, status=500)

async def start_bot(app):
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

async def main():
    logging.info("Rashidov Market Boti ishga tushdi (Bot + API Supabase orqali)...")
    
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("admin", admin_cmd))
    app.add_handler(CallbackQueryHandler(language_callback, pattern=r"^lang_"))
    app.add_handler(MessageHandler(filters.CONTACT, contact_handler))
    app.add_handler(MessageHandler(filters.Regex(r"^📦 Buyurtmalarim$|^📦 Мои заказы$"), my_orders_menu))
    app.add_handler(MessageHandler(filters.Regex(r"^📞 Bog'lanish$|^📞 Контакты$"), contact_us_menu))
    app.add_handler(MessageHandler(filters.Regex(r"^✍️ Ma'lumotlarni o'zgartirish$|^✍️ Изменить данные$"), settings_handler))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, webapp_data_handler))
    app.add_handler(CallbackQueryHandler(edit_callback, pattern=r"^(edit_name|edit_phone)$"))
    app.add_handler(CallbackQueryHandler(order_action_callback, pattern=r"^(cancel|pay)_"))
    app.add_handler(CallbackQueryHandler(buy_callback, pattern=r"^buy_"))
    
    web_app = web.Application()
    
    cors = aiohttp_cors.setup(web_app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })
    
    products_res = cors.add(web_app.router.add_resource("/api/products"))
    cors.add(products_res.add_route("GET", api_get_products))
    cors.add(products_res.add_route("POST", api_add_product))
    
    product_res = cors.add(web_app.router.add_resource("/api/products/{id}"))
    cors.add(product_res.add_route("DELETE", api_delete_product))
    
    runner = web.AppRunner(web_app)
    await runner.setup()
    site = web.TCPSite(runner, '127.0.0.1', 8000)
    await site.start()
    logging.info("AIOHTTP Server running on 127.0.0.1:8000")
    
    await start_bot(app)
    
    while True:
        await asyncio.sleep(3600)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
