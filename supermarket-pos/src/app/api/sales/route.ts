import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { items, totalAmount, paymentMethod, customerId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Savat bo'sh" }, { status: 400 });
    }

    const totalCost = items.reduce((sum: number, item: any) => sum + (item.costPrice * item.quantity), 0);

    const sale = await prisma.$transaction(async (tx) => {
      // Create sale record
      const newSale = await tx.sale.create({
        data: {
          totalAmount: Number(totalAmount),
          totalCost: Number(totalCost),
          paymentMethod: paymentMethod || "CASH",
          customerId: customerId || null,
          items: {
            create: items.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.sellPrice,
              cost: item.costPrice,
            })),
          },
        },
      });

      // Update stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // If DEBT, update customer balance
      if (paymentMethod === 'DEBT' && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { increment: Number(totalAmount) } },
        });
      }

      // If PERSONAL consumption, log it as an expense so we know where items went
      if (paymentMethod === 'PERSONAL') {
        await tx.transaction.create({
          data: {
            type: 'PERSONAL',
            amount: Number(totalCost), // Logged as cost, not sell price
            description: "Shaxsiy iste'mol uchun tovarlar olindi",
          }
        });
      }

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Savdoni amalga oshirishda xatolik" }, { status: 500 });
  }
}
