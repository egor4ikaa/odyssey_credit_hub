import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';
import { mockCompanyByInn, decodeHtmlEntities } from '@/lib/mocks';

export const dynamic = 'force-dynamic';

function parseApp(app: any) {
  if (!app) return app;
  let conditions = app.conditions;
  if (typeof conditions === 'string') {
    try { conditions = JSON.parse(conditions); } catch { conditions = null; }
  }
  return { ...app, conditions };
}

export async function GET() {
  const user = await requireUser();
  const applications = await prisma.application.findMany({
    where: user.role === 'OPERATOR' ? {} : { userId: user.id },
    include: { product: true, company: true },
    orderBy: { createdAt: 'desc' }
  });
  return ok({ applications: applications.map(parseApp) });
}

export async function POST(req: Request) {
  try {
    const user = await requireUser('CLIENT');
    const body = await req.json();
    const { productId, inn, amount, term, goal } = body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new HttpError(404, 'Продукт не найден');

    const cleanInn = String(inn || '').replace(/\D/g, '');
    if (cleanInn.length !== 10 && cleanInn.length !== 12) throw new HttpError(400, 'ИНН должен содержать 10 или 12 цифр');
    if (!amount || !term || !goal) throw new HttpError(400, 'Заполните сумму, срок и цель');

    /* Автозаполнение из мока ЕГРЮЛ: если компании нет в БД — подтягиваем из «внешнего» источника */
    const company = await prisma.company.upsert({
      where: { inn: cleanInn },
      update: {},
      create: await mockCompanyByInn(cleanInn)
    });

    const application = await prisma.application.create({
      data: {
        number: `ACH-2026-${Date.now().toString(36).toUpperCase()}`,
        userId: user.id,
        companyInn: cleanInn,
        productId: product.id,
        amount: Math.round(Number(amount)),
        term: Math.round(Number(term)),
        goal: String(goal),
        status: 'DRAFT'
      }
    });

    await prisma.event.create({
      data: { applicationId: application.id, type: 'INFO', message: `Черновик заявки создан. Компания: ${decodeHtmlEntities(company.name)}.` }
    });

    return ok({ application }, 201);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
