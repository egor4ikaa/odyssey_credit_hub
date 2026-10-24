import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';
import { runPipeline } from '@/lib/pipeline';
import { canTransition } from '@/lib/stateMachine';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('CLIENT');
    const app = await prisma.application.findUniqueOrThrow({ where: { id: params.id } });
    if (app.userId !== user.id) throw new HttpError(403, 'Нет доступа');

    const from = app.status === 'ADDITIONAL_INFO_REQUIRED' ? app.status : 'DRAFT';
    if (!canTransition(from, 'SUBMITTED')) throw new HttpError(409, `Нельзя отправить заявку из статуса «${app.status}»`);

    await prisma.application.update({ where: { id: app.id }, data: { status: 'SUBMITTED' } });
    await prisma.event.create({
      data: { applicationId: app.id, type: 'ACTION', message: 'Заявка отправлена на рассмотрение в банк.' }
    });

    runPipeline(app.id); // асинхронный конвейер
    return ok({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
