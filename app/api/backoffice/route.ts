import { prisma } from '@/lib/prisma';
import { requireUser, ok } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function parseApp(app: any) {
  if (!app) return app;
  let conditions = app.conditions;
  if (typeof conditions === 'string') {
    try { conditions = JSON.parse(conditions); } catch { conditions = null; }
  }
  return { ...app, conditions };
}

export async function GET(req: Request) {
  await requireUser('OPERATOR');
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status');

  const where = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter as any } : {};

  const applications = await prisma.application.findMany({
    where,
    include: { product: true, company: true, user: true },
    orderBy: { updatedAt: 'desc' }
  });

  const parsed = applications.map(parseApp);
  return ok({ applications: parsed, queue: parsed.filter(a => a.status === 'MANUAL_REVIEW') });
}
