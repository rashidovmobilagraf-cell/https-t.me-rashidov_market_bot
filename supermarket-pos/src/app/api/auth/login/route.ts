import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'PIN 4 xonali bo`lishi kerak' }, { status: 400 });
    }

    // Check if any users exist, if not create default Admin
    const usersCount = await prisma.user.count();
    if (usersCount === 0) {
      await prisma.user.create({
        data: {
          name: 'Admin',
          pin: '1234',
          role: 'ADMIN',
        }
      });
      if (pin === '1234') {
        const user = await prisma.user.findUnique({ where: { pin } });
        return NextResponse.json(user);
      }
    }

    const user = await prisma.user.findUnique({
      where: { pin }
    });

    if (!user) {
      return NextResponse.json({ error: 'Noto`g`ri PIN-kod' }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
