import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const app = await prisma.application.findUniqueOrThrow({ where: { id: params.id } });
    if (user.role !== 'OPERATOR' && app.userId !== user.id) throw new HttpError(403, 'Нет доступа');
    const events = await prisma.event.findMany({
      where: { applicationId: params.id },
      orderBy: { createdAt: 'desc' }
    });
    return ok({ status: app.status, score: app.score, events });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 404 });
  }
}
