import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { sales: true },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Mijozlarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Yaratishda xatolik" }, { status: 500 });
  }
}
