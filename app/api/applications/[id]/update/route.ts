import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('CLIENT');
    const app = await prisma.application.findUniqueOrThrow({ where: { id: params.id } });
    if (app.userId !== user.id) throw new HttpError(403, 'Нет доступа');
    if (app.status !== 'ADDITIONAL_INFO_REQUIRED') throw new HttpError(409, 'Обновление доступно только при статусе «Требуется уточнение»');

    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.amount) data.amount = Math.round(Number(body.amount));
    if (body.term) data.term = Math.round(Number(body.term));
    if (body.goal) data.goal = String(body.goal);

    await prisma.application.update({ where: { id: app.id }, data });
    await prisma.event.create({
      data: { applicationId: app.id, type: 'ACTION', message: 'Клиент уточнил данные заявки.' }
    });
    return ok({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
