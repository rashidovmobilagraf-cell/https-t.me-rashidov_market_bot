import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const TOKEN = "8870579743:AAEdthy1BtGhtZMk6GrFQCBzPXfTSgEwL_4";

export async function POST(request: Request) {
  try {
    const { customerId, message } = await request.json();

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer || !customer.telegramChatId) {
      return NextResponse.json({ error: "Mijozning telegram pochtasi ulanmagan (Botga kirmagan)" }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: customer.telegramChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Xabar yuborishda xatolik" }, { status: 500 });
  }
}
