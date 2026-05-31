import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address || null,
        telegramId: data.telegramId || null,
        birthday: data.birthday ? new Date(data.birthday) : null,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Yangilashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Check if customer has unpaid debts
    const c = await prisma.customer.findUnique({ where: { id } });
    if (c && c.balance > 0) {
      return NextResponse.json({ error: "Qarzi bor mijozni o'chirib bo'lmaydi" }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
  }
}
