import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    // 1. Today's sales & profit
    const todaySalesData = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        paymentMethod: {
          not: 'PERSONAL'
        }
      },
      _sum: {
        totalAmount: true,
        totalCost: true,
      },
    });

    const todaySalesTotal = todaySalesData._sum.totalAmount || 0;
    const todayCostTotal = todaySalesData._sum.totalCost || 0;
    const todayGrossProfit = todaySalesTotal - todayCostTotal;

    // 1.1 Today's transactions
    const todayTx = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    let todayExpenses = 0;
    let todayIncome = 0;
    let todayPersonal = 0;

    todayTx.forEach(tx => {
      if (tx.type === 'EXPENSE') todayExpenses = tx._sum.amount || 0;
      if (tx.type === 'INCOME' || tx.type === 'INVESTMENT' || tx.type === 'DEBT_REPAYMENT') todayIncome += tx._sum.amount || 0;
      if (tx.type === 'PERSONAL') todayPersonal = tx._sum.amount || 0;
    });

    const netProfit = todayGrossProfit - todayExpenses;

    // 1.2 Cash in Register (Today)
    // All Cash Sales today
    const cashSalesData = await prisma.sale.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
      },
      _sum: { cashAmount: true }
    });
    const cashSales = cashSalesData._sum.cashAmount || 0;

    const cashInRegister = cashSales + todayIncome - todayExpenses - todayPersonal;

    // 1.2 Total Debt from Customers
    const totalDebtData = await prisma.customer.aggregate({
      _sum: {
        balance: true,
      }
    });
    const totalDebt = totalDebtData._sum.balance || 0;

    // 2. Low stock products (e.g. less than 10)
    const lowStock = await prisma.product.findMany({
      where: { stock: { lt: 10 }, isDeleted: false },
      take: 10,
    });

    // 3. Expiring soon products (e.g. within next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringSoon = await prisma.product.findMany({
      where: {
        isDeleted: false,
        expiryDate: {
          lte: thirtyDaysFromNow,
          gte: today, // ignore already expired maybe? Let's show all that are < 30 days
        },
      },
      orderBy: { expiryDate: 'asc' },
      take: 10,
    });

    // 4. Top selling products
    const topSellingItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topSellingIds = topSellingItems.map(item => item.productId);
    const topProducts = await prisma.product.findMany({
      where: { id: { in: topSellingIds } }
    });

    const topSelling = topSellingItems.map(item => {
      const p = topProducts.find(prod => prod.id === item.productId);
      return {
        id: item.productId,
        name: p?.name || 'Unknown',
        soldQuantity: item._sum.quantity,
      };
    });

    // 5. Dead stock (products with 0 sales)
    const soldProductIdsRaw = await prisma.saleItem.groupBy({
      by: ['productId'],
    });
    const soldProductIds = soldProductIdsRaw.map(s => s.productId);

    const deadStock = await prisma.product.findMany({
      where: {
        isDeleted: false,
        id: { notIn: soldProductIds },
        stock: { gt: 0 }
      },
      take: 10,
    });

    return NextResponse.json({
      todaySalesTotal,
      todayGrossProfit,
      todayExpenses,
      netProfit,
      cashInRegister,
      totalDebt,
      lowStock,
      expiringSoon,
      topSelling,
      deadStock,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Dashboard ma'lumotlarini olishda xatolik" }, { status: 500 });
  }
}
