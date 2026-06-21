import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { unauthorized, badRequest } from '@/lib/api-response';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const rows = await prisma.bodyMeasurement.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
    take: 12,
  });

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      date: r.date.toISOString().slice(0, 10),
      neck: r.neck,
      chest: r.chest,
      waist: r.waist,
      hips: r.hips,
      bicepL: r.bicepL,
      bicepR: r.bicepR,
      thighL: r.thighL,
      thighR: r.thighR,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json();
  const { date, neck, chest, waist, hips, bicepL, bicepR, thighL, thighR } = body;
  if (!date) return badRequest('date required');

  const toFloat = (v: unknown) => (v !== undefined && v !== null && v !== '' ? Number(v) || null : null);

  const row = await prisma.bodyMeasurement.upsert({
    where: { userId_date: { userId: session.user.id, date: new Date(date) } },
    create: {
      userId: session.user.id,
      date: new Date(date),
      neck: toFloat(neck),
      chest: toFloat(chest),
      waist: toFloat(waist),
      hips: toFloat(hips),
      bicepL: toFloat(bicepL),
      bicepR: toFloat(bicepR),
      thighL: toFloat(thighL),
      thighR: toFloat(thighR),
    },
    update: {
      neck: toFloat(neck),
      chest: toFloat(chest),
      waist: toFloat(waist),
      hips: toFloat(hips),
      bicepL: toFloat(bicepL),
      bicepR: toFloat(bicepR),
      thighL: toFloat(thighL),
      thighR: toFloat(thighR),
    },
  });

  return NextResponse.json({ id: row.id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return badRequest('id required');

  await prisma.bodyMeasurement.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
