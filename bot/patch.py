import re

with open("main.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add admin check to webapp_data_handler
old1 = """            await update.message.reply_text(receipt, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:"""
new1 = """            await update.message.reply_text(receipt, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))
            
            if ADMIN_ID != 0:
                admin_keyboard = [
                    [InlineKeyboardButton("✅ Qabul qilish", callback_data=f"admin_accept_{order_id}"),
                     InlineKeyboardButton("❌ Bekor qilish", callback_data=f"admin_reject_{order_id}")]
                ]
                await context.bot.send_message(
                    chat_id=ADMIN_ID,
                    text=f"🔔 *YANGI BUYURTMA!*\\n\\n{receipt}",
                    parse_mode="Markdown",
                    reply_markup=InlineKeyboardMarkup(admin_keyboard)
                )
    except Exception as e:"""
content = content.replace(old1, new1)

# 2. Add admin notification to pay callback
old2 = """    elif action == "pay":
        order["status"] = "To'langan (Tasdiqlanmoqda)"
        save_json(ORDERS_FILE, ORDERS)
        await query.edit_message_text(f"✅ Buyurtma #{order_id} uchun to'lov qildingiz. Admin tasdiqlashi kutilmoqda.")"""
new2 = """    elif action == "pay":
        order["status"] = "To'langan (Tasdiqlanmoqda)"
        save_json(ORDERS_FILE, ORDERS)
        await query.edit_message_text(f"✅ Buyurtma #{order_id} uchun to'lov qildingiz. Admin tasdiqlashi kutilmoqda.")
        
        if ADMIN_ID != 0:
            await context.bot.send_message(
                chat_id=ADMIN_ID,
                text=f"💳 *MIJOZ TO'LOV QILDI!*\\nBuyurtma: #{order_id}\\nIltimos kartangizni tekshiring.",
                parse_mode="Markdown"
            )"""
content = content.replace(old2, new2)

# 3. Add admin commands and admin callback
admin_code = """# ---- Admin Commands for Products ----
async def admin_cmd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if ADMIN_ID != 0 and user_id != ADMIN_ID:
        await update.message.reply_text("Siz admin emassiz!")
        return
        
    keyboard = [
        [InlineKeyboardButton("📊 Yangi buyurtmalar", callback_data="admin_orders")],
        [InlineKeyboardButton("➕ Mahsulot qo'shish", callback_data="admin_add")],
        [InlineKeyboardButton("✏️ Narx/nom o'zgartirish", callback_data="admin_edit")],
        [InlineKeyboardButton("🗑️ Mahsulotni o'chirish", callback_data="admin_delete")]
    ]
    await update.message.reply_text("🛠 *Admin Panel*\\nO'zingizga kerakli bo'limni tanlang:", reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="Markdown")

async def admin_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = query.from_user.id
    
    if ADMIN_ID != 0 and user_id != ADMIN_ID:
        await query.edit_message_text("Siz admin emassiz!")
        return

    if data == "admin_orders":
        pending_orders = [o for o in ORDERS if o["status"] in ["Kutilmoqda", "To'langan (Tasdiqlanmoqda)"]]
        if not pending_orders:
            await query.edit_message_text("Yangi buyurtmalar yo'q.")
            return
        text = "📦 *Kutilayotgan buyurtmalar:*\\n\\n"
        for o in pending_orders:
            text += f"🔖 *#{o['order_id']}* - {o['total']} so'm ({o['status']})\\n"
        await query.edit_message_text(text, parse_mode="Markdown")
        
    elif data.startswith("admin_accept_"):
        order_id = data.split("_")[2]
        order = next((o for o in ORDERS if o["order_id"] == order_id), None)
        if order:
            order["status"] = "Yetkazilmoqda"
            save_json(ORDERS_FILE, ORDERS)
            await query.edit_message_text(f"✅ Buyurtma #{order_id} qabul qilindi.")
            try:
                await context.bot.send_message(chat_id=order["user_id"], text=f"🎉 Buyurtmangiz (#{order_id}) admin tomonidan qabul qilindi va yetkazib berishga tayyorlanmoqda!")
            except: pass
            
    elif data.startswith("admin_reject_"):
        order_id = data.split("_")[2]
        order = next((o for o in ORDERS if o["order_id"] == order_id), None)
        if order:
            order["status"] = "Bekor qilingan"
            save_json(ORDERS_FILE, ORDERS)
            await query.edit_message_text(f"❌ Buyurtma #{order_id} bekor qilindi.")
            try:
                await context.bot.send_message(chat_id=order["user_id"], text=f"❌ Kechirasiz, buyurtmangiz (#{order_id}) admin tomonidan bekor qilindi.")
            except: pass

"""
content = content.replace("# ---- Admin Commands for Products ----\n", admin_code)

# 4. Modify add_start
old_add = """async def add_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    logging.info(f"/add started by {update.effective_user.id}")
    if ADMIN_ID != 0 and update.effective_user.id != ADMIN_ID:
        logging.info("Not admin!")
        await update.message.reply_text("Siz admin emassiz!")
        return ConversationHandler.END
    await update.message.reply_text("Mahsulot nomini kiriting:", reply_markup=ReplyKeyboardRemove())
    return 1"""
new_add = """async def add_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.callback_query.message if update.callback_query else update.message
    user_id = update.effective_user.id
    if update.callback_query:
        await update.callback_query.answer()
    if ADMIN_ID != 0 and user_id != ADMIN_ID:
        await message.reply_text("Siz admin emassiz!")
        return ConversationHandler.END
    await message.reply_text("Mahsulot nomini kiriting:", reply_markup=ReplyKeyboardRemove())
    return 1"""
content = content.replace(old_add, new_add)

# 5. Modify edit_start
old_edit = """async def edit_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if ADMIN_ID != 0 and update.effective_user.id != ADMIN_ID:
        await update.message.reply_text("Siz admin emassiz!")
        return ConversationHandler.END
    if not PRODUCTS:
        await update.message.reply_text("Mahsulot yo'q.")
        return ConversationHandler.END"""
new_edit = """async def edit_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.callback_query.message if update.callback_query else update.message
    user_id = update.effective_user.id
    if update.callback_query:
        await update.callback_query.answer()
    if ADMIN_ID != 0 and user_id != ADMIN_ID:
        await message.reply_text("Siz admin emassiz!")
        return ConversationHandler.END
    if not PRODUCTS:
        await message.reply_text("Mahsulot yo'q.")
        return ConversationHandler.END"""
content = content.replace(old_edit, new_edit)

# 6. Modify delete_start
old_delete = """async def delete_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if ADMIN_ID != 0 and update.effective_user.id != ADMIN_ID:
        await update.message.reply_text("Siz admin emassiz!")
        return ConversationHandler.END
    if not PRODUCTS:
        await update.message.reply_text("Mahsulot yo'q.")
        return ConversationHandler.END"""
content = content.replace(old_delete, new_edit.replace("edit_start", "delete_start"))

# 7. Modify main app handlers
old_handlers = """    app.add_handler(CommandHandler("myid", myid_cmd))
    app.add_handler(CommandHandler("start", start))"""
new_handlers = """    app.add_handler(CommandHandler("myid", myid_cmd))
    app.add_handler(CommandHandler("admin", admin_cmd))
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(admin_callback_handler, pattern=r"^admin_(orders|accept_|reject_)"))"""
content = content.replace(old_handlers, new_handlers)

# 8. Modify entry points
content = content.replace('entry_points=[CommandHandler("add", add_start)]', 'entry_points=[CommandHandler("add", add_start), CallbackQueryHandler(add_start, pattern="^admin_add$")]')
content = content.replace('entry_points=[CommandHandler("edit", edit_start)]', 'entry_points=[CommandHandler("edit", edit_start), CallbackQueryHandler(edit_start, pattern="^admin_edit$")]')
content = content.replace('entry_points=[CommandHandler("delete", delete_start)]', 'entry_points=[CommandHandler("delete", delete_start), CallbackQueryHandler(delete_start, pattern="^admin_delete$")]')


with open("main.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Patched!")
