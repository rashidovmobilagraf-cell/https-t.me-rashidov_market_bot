import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');

  try {
    if (barcode) {
      const product = await prisma.product.findFirst({
        where: { barcode, isDeleted: false },
      });
      if (!product) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 });
      return NextResponse.json(product);
    }

    const products = await prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check if barcode already exists and not deleted
    const existing = await prisma.product.findFirst({ 
      where: { barcode: data.barcode, isDeleted: false } 
    });
    if (existing) {
      return NextResponse.json({ error: "Bu shtrix-kod ro'yxatda bor" }, { status: 400 });
    }

      const product = await prisma.product.create({
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
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Yaratishda xatolik' }, { status: 500 });
  }
}
