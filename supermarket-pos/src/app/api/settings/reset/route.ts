import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    await prisma.$transaction([
      prisma.saleItem.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.product.deleteMany(),
      prisma.customer.deleteMany(),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Tozalashda xatolik yuz berdi" }, { status: 500 });
  }
}
