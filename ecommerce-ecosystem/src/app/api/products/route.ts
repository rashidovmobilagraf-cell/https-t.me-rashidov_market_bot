import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}

// POST endpoint to allow Admin to create a new product
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, oldPrice, stock, imageUrl } = body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseInt(price),
        oldPrice: oldPrice ? parseInt(oldPrice) : null,
        stock: parseInt(stock) || 0,
        imageUrl,
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
