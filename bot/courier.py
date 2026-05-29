import os
import logging
import asyncio
import asyncpg
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
load_dotenv()

# Assuming a separate token or same token, but usually a separate bot for couriers is better.
# For simplicity, we use COURIER_BOT_TOKEN
COURIER_BOT_TOKEN = os.getenv("COURIER_BOT_TOKEN", os.getenv("BOT_TOKEN", "MOCK_COURIER_TOKEN"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ecommerce")

bot = Bot(token=COURIER_BOT_TOKEN)
dp = Dispatcher()
db_pool = None

async def init_db_pool():
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    logging.info("Kuryer boti bazaga ulandi!")

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    name = message.from_user.first_name
    
    async with db_pool.acquire() as conn:
        import uuid
        uid = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO users (id, telegram_id, lang, name, role, updated_at) 
            VALUES ($1, $2, 'uz', $3, 'COURIER', NOW())
            ON CONFLICT (telegram_id) DO UPDATE 
            SET role = 'COURIER', name = EXCLUDED.name, updated_at = NOW()
        """, uid, user_id, name)
        
    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📱 Raqamni yuborish", request_contact=True))
    
    await message.answer(
        f"Assalomu alaykum kuryer {name}! Tizimga kirish uchun telefon raqamingizni yuboring:",
        reply_markup=builder.as_markup(resize_keyboard=True)
    )

@dp.message(F.contact)
async def process_contact(message: types.Message):
    user_id = message.from_user.id
    contact = message.contact
    
    async with db_pool.acquire() as conn:
        await conn.execute("""
            UPDATE users SET phone = $1, updated_at = NOW()
            WHERE telegram_id = $2
        """, contact.phone_number, user_id)

    builder = ReplyKeyboardBuilder()
    builder.add(KeyboardButton(text="📦 Mening buyurtmalarim"))
    
    await message.answer(
        "Muvaffaqiyatli ro'yxatdan o'tdingiz. Yangi buyurtmalar shu yerga keladi.",
        reply_markup=builder.as_markup(resize_keyboard=True)
    )

# Status update callback
@dp.callback_query(F.data.startswith("status_"))
async def process_status(callback: types.CallbackQuery):
    action, order_id = callback.data.split("_")[1:]
    
    async with db_pool.acquire() as conn:
        if action == "departed":
            await conn.execute("UPDATE orders SET status = 'COURIER' WHERE id = $1", order_id)
            await callback.message.edit_text(callback.message.text + "\n\n✅ Status: Yo'lga chiqdim")
            
            # TODO: Send notification to customer bot that courier has departed
            
        elif action == "delivered":
            await conn.execute("UPDATE orders SET status = 'DELIVERED' WHERE id = $1", order_id)
            await callback.message.edit_text(callback.message.text + "\n\n✅ Status: Yetkazib berildi")
            
            # TODO: Send notification to customer
            
    await callback.answer("Status yangilandi")

async def main():
    await init_db_pool()
    print("Kuryer boti ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
