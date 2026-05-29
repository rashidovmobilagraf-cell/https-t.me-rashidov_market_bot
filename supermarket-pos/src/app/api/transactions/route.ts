import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true }
    });
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Xarajatlarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const transaction = await prisma.$transaction(async (tx) => {
      const newTx = await tx.transaction.create({
        data: {
          type: data.type,
          amount: Number(data.amount),
          description: data.description,
          customerId: data.customerId || null,
        },
      });

      // If it's a debt repayment, decrease customer's debt balance
      if (data.type === 'DEBT_REPAYMENT' && data.customerId) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            balance: {
              decrement: Number(data.amount),
            },
          },
        });
      }

      return newTx;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Yaratishda xatolik" }, { status: 500 });
  }
}
