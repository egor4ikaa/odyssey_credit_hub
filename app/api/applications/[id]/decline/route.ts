import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';
import { declineDecision } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser('CLIENT');
    const app = await prisma.application.findUniqueOrThrow({ where: { id: params.id } });
    if (app.userId !== user.id) throw new HttpError(403, 'Нет доступа');
    await declineDecision(app.id);
    return ok({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
