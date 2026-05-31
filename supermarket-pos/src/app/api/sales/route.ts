import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      take: 100, // Load last 100 sales for history
    });
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: "Savdolarni olishda xatolik" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { 
      items, 
      totalAmount, 
      paymentMethod, 
      customerId,
      cashAmount,
      cardAmount,
      p2pAmount,
      debtAmount,
      cashbackUsed = 0,
      cashierId
    } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Savat bo'sh" }, { status: 400 });
    }

    const totalCost = items.reduce((sum: number, item: any) => sum + (item.costPrice * item.quantity), 0);

    const sale = await prisma.$transaction(async (tx) => {
      // Setup payment amounts based on method
      let finalCash = 0;
      let finalCard = 0;
      let finalP2P = 0;
      let finalDebt = 0;

      if (paymentMethod === 'MIXED') {
        finalCash = Number(cashAmount) || 0;
        finalCard = Number(cardAmount) || 0;
        finalP2P = Number(p2pAmount) || 0;
        finalDebt = Number(debtAmount) || 0;
      } else if (paymentMethod === 'CASH') {
        finalCash = Number(totalAmount);
      } else if (paymentMethod === 'CARD') {
        finalCard = Number(totalAmount);
      } else if (paymentMethod === 'P2P') {
        finalP2P = Number(totalAmount);
      } else if (paymentMethod === 'DEBT') {
        finalDebt = Number(totalAmount);
      }

      // Keshbek hisoblash (1%)
      const netPaidAmount = Number(totalAmount) - Number(cashbackUsed);
      const cashbackEarned = (netPaidAmount > 0 && customerId) ? netPaidAmount * 0.01 : 0;

      // Create sale record
      const newSale = await tx.sale.create({
        data: {
          totalAmount: Number(totalAmount),
          totalCost: Number(totalCost),
          paymentMethod: paymentMethod || "CASH",
          cashAmount: finalCash,
          cardAmount: finalCard,
          p2pAmount: finalP2P,
          debtAmount: finalDebt,
          customerId: customerId || null,
          cashierId: cashierId || null,
          cashbackUsed: Number(cashbackUsed),
          cashbackEarned: cashbackEarned,
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

      // Update stock and check minStock for auto-ordering
      for (const item of items) {
        const updatedProduct = await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });

        if (updatedProduct.minStock > 0 && updatedProduct.stock <= updatedProduct.minStock) {
          const existingOrder = await tx.supplierOrder.findFirst({
            where: { productId: updatedProduct.id, status: 'PENDING' }
          });
          
          if (!existingOrder) {
            await tx.supplierOrder.create({
              data: {
                productId: updatedProduct.id,
                status: 'PENDING',
                quantity: updatedProduct.minStock * 2 // Default suggestion
              }
            });
          }
        }
      }

      // If there is ANY debt (either purely DEBT or a MIXED payment with debt)
      if ((finalDebt > 0 || cashbackEarned > 0 || cashbackUsed > 0) && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { 
            balance: { increment: finalDebt },
            cashbackBalance: { increment: cashbackEarned - Number(cashbackUsed) }
          },
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
