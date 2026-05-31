import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        type: data.type,
        amount: Number(data.amount),
        description: data.description,
      },
    });
    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json({ error: "Tahrirlashda xatolik" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.transaction.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
  }
}
