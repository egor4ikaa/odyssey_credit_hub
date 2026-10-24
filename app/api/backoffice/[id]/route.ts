import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError } from '@/lib/auth';
import { buildConditions, fmt } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser('OPERATOR');
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: params.id },
      include: { product: true }
    });

    const { action, comment } = await req.json();
    const note = comment ? ` Комментарий: ${comment}.` : '';

    if (action === 'approve') {
      const conditions = buildConditions(app.amount, app.term, app.product.rate + 1);
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'APPROVED', conditions: JSON.stringify(conditions), decisionReason: `Одобрено кредитным специалистом.${note}` }
      });
      await prisma.event.create({
        data: { applicationId: app.id, type: 'DECISION', message: `Ручное решение: одобрено на ${fmt(conditions.amount)} ₽, ${conditions.term} мес., ${conditions.rate}%.${note}` }
      });
    } else if (action === 'reject') {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'REJECTED', decisionReason: `Отказ по решению кредитного специалиста.${note}` }
      });
      await prisma.event.create({
        data: { applicationId: app.id, type: 'DECISION', message: `Ручное решение: отказ.${note}` }
      });
    } else if (action === 'request_info') {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'ADDITIONAL_INFO_REQUIRED', decisionReason: comment || 'Требуются уточнения по заявке.' }
      });
      await prisma.event.create({
        data: { applicationId: app.id, type: 'ACTION', message: `Запрошена дополнительная информация у клиента.${note}` }
      });
    } else if (action === 'verify_output') {
      await prisma.application.update({
        where: { id: app.id },
        data: { status: 'APPROVED', decisionReason: `Проверено на выходе. Готово к выдаче.${note}` }
      });
      await prisma.event.create({
        data: { applicationId: app.id, type: 'CHECK', message: `Финальная проверка на выходе успешна. Заявка верифицирована.${note}` }
      });
    } else {
      throw new HttpError(400, 'Неизвестное действие');
    }

    return ok({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser('OPERATOR');
    const body = await req.json();
    const { amount, term, rate, status, decisionReason, monthlyPayment } = body;

    const app = await prisma.application.findUniqueOrThrow({
      where: { id: params.id },
      include: { product: true }
    });

    const newAmount = amount !== undefined ? Number(amount) : app.amount;
    const newTerm = term !== undefined ? Number(term) : app.term;
    const currentConditions: any = typeof app.conditions === 'string' ? JSON.parse(app.conditions || '{}') : (app.conditions || {});
    const newRate = rate !== undefined ? Number(rate) : (currentConditions.rate || app.product.rate);

    const conditions = buildConditions(newAmount, newTerm, newRate);
    if (monthlyPayment !== undefined) {
      conditions.monthlyPayment = Number(monthlyPayment);
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        amount: newAmount,
        term: newTerm,
        status: status !== undefined ? status : app.status,
        decisionReason: decisionReason !== undefined ? decisionReason : app.decisionReason,
        conditions: JSON.stringify(conditions)
      }
    });

    await prisma.event.create({
      data: {
        applicationId: app.id,
        type: 'ACTION',
        message: `Администратор отредактировал заявку: сумма ${fmt(newAmount)} ₽, период ${newTerm} мес., процент ${newRate}%, платёж ${fmt(conditions.monthlyPayment)} ₽/мес., статус ${updated.status}.`
      }
    });

    return ok({ application: updated });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser('OPERATOR');
    await prisma.event.deleteMany({ where: { applicationId: params.id } });
    await prisma.application.delete({ where: { id: params.id } });
    return ok({ success: true, message: 'Заявка удалена администратором' });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
