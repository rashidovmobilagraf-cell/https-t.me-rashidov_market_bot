import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      telegramId, // Used to find the User
      items,      // Array of { productId, quantity, price }
      paymentMethod,
      totalAmount,
      deliveryPrice,
      addressLat,
      addressLng,
      addressText 
    } = body;

    // First find the user
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (!user) {
      return NextResponse.json({ error: "Foydalanuvchi topilmadi" }, { status: 404 });
    }

    // Convert payment string to Prisma Enum
    const mappedPaymentMethod = paymentMethod.toUpperCase() as PaymentMethod;

    // Create Order and OrderItems in a transaction
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        paymentMethod: mappedPaymentMethod,
        totalAmount,
        deliveryPrice,
        addressLat,
        addressLng,
        addressText,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(order, { status: 201 });

  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}
