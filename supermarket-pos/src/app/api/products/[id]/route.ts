import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = await request.json();
    const product = await prisma.product.update({
      where: { id },
      data: {
        barcode: data.barcode,
        name: data.name,
        costPrice: Number(data.costPrice),
        sellPrice: Number(data.sellPrice),
        stock: Number(data.stock),
        minStock: Number(data.minStock || 0),
        crossSellMessage: data.crossSellMessage || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      },
    });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Tahrirlashda xatolik' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.product.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    // If foreign key constraint fails (product has sales), do a soft delete
    try {
      await prisma.product.update({
        where: { id },
        data: { 
          isDeleted: true,
          barcode: `${id}_deleted`, // Free up original barcode
          stock: 0
        },
      });
      return NextResponse.json({ success: true, softDeleted: true });
    } catch (e) {
      return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
    }
  }
}
