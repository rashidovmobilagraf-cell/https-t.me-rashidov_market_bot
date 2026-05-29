import os

main_py_path = r"C:\Users\Profit\.gemini\antigravity\scratch\bot\main.py"

with open(main_py_path, "r", encoding="utf-8") as f:
    content = f.read()

marker = "# ---- Admin Commands for Products ----"
idx = content.find(marker)

if idx != -1:
    content = content[:idx]

new_code = """# ---- Admin Commands for Products ----
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

# --- aiohttp Web API ---
from aiohttp import web
import aiohttp_cors
import asyncio

async def api_get_products(request):
    return web.json_response(PRODUCTS)

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
        PRODUCTS.append(new_product)
        save_json(PRODUCTS_FILE, PRODUCTS)
        webapp_products = os.path.join(os.path.dirname(__file__), "..", "webapp", "public", "products.json")
        save_json(webapp_products, PRODUCTS)
        return web.json_response({"success": True, "product": new_product})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)}, status=500)

async def api_delete_product(request):
    try:
        p_id = request.match_info.get("id")
        global PRODUCTS
        PRODUCTS = [p for p in PRODUCTS if p["id"] != p_id]
        save_json(PRODUCTS_FILE, PRODUCTS)
        webapp_products = os.path.join(os.path.dirname(__file__), "..", "webapp", "public", "products.json")
        save_json(webapp_products, PRODUCTS)
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"success": False, "error": str(e)}, status=500)

async def start_bot(app):
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)

async def main():
    logging.info("Rashidov Market Boti ishga tushdi (Bot + API)...")
    
    # Configure Bot Commands
    app.add_handler(CommandHandler("start", start_cmd))
    app.add_handler(CommandHandler("admin", admin_cmd))
    app.add_handler(MessageHandler(filters.Regex(r"^📦 Buyurtmalarim$|^📦 Мои заказы$"), my_orders_menu))
    app.add_handler(MessageHandler(filters.Regex(r"^📞 Bog'lanish$|^📞 Контакты$"), contact_us_menu))
    app.add_handler(MessageHandler(filters.Regex(r"^✍️ Ma'lumotlarni o'zgartirish$|^✍️ Изменить данные$"), settings_handler))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))
    app.add_handler(CallbackQueryHandler(edit_callback, pattern=r"^(edit_name|edit_phone)$"))
    app.add_handler(CallbackQueryHandler(order_action_callback, pattern=r"^(cancel|pay)_"))
    app.add_handler(CallbackQueryHandler(buy_callback, pattern=r"^buy_"))
    
    # Web Server
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
    
    # Start bot
    await start_bot(app)
    
    # Keep alive
    while True:
        await asyncio.sleep(3600)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
"""

with open(main_py_path, "w", encoding="utf-8") as f:
    f.write(content + new_code)
