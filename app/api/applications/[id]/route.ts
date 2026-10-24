import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function parseApp(app: any) {
  if (!app) return app;
  let conditions = app.conditions;
  if (typeof conditions === 'string') {
    try { conditions = JSON.parse(conditions); } catch { conditions = null; }
  }
  return { ...app, conditions };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: params.id },
      include: { product: true, company: true, events: { orderBy: { createdAt: 'desc' } } }
    });
    if (user.role !== 'OPERATOR' && app.userId !== user.id) throw new HttpError(403, 'Нет доступа');
    return ok({ application: parseApp(app) });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: params.id }
    });

    if (user.role !== 'OPERATOR' && app.userId !== user.id) {
      throw new HttpError(403, 'Вы можете удалять только свои заявки');
    }

    await prisma.event.deleteMany({ where: { applicationId: params.id } });
    await prisma.application.delete({ where: { id: params.id } });
    return ok({ success: true, message: 'Заявка успешно удалена' });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
