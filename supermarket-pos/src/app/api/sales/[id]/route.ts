import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      // Get the sale with items
      const sale = await tx.sale.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!sale) throw new Error("Savdo topilmadi");

      // 1. Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // 2. Reduce debt if it was a DEBT payment
      if (sale.paymentMethod === 'DEBT' && sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { balance: { decrement: sale.totalAmount } }
        });
      }

      // 3. Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id }
      });

      // 4. Delete the sale itself
      await tx.sale.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "O'chirishda xatolik" }, { status: 500 });
  }
}
