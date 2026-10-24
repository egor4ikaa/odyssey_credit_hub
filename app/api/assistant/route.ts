import { prisma } from '@/lib/prisma';
import { requireUser, ok } from '@/lib/auth';
import { askGigaChat } from '@/lib/gigachat';
import { offlineAssistantReply, askYandexGPT } from '@/lib/yandex';
import { STATUS_LABELS } from '@/lib/status';
import { fmt } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await requireUser();
  const { message, applicationId } = await req.json();

  let context = 'Контекст личного кабинета: пользователь авторизован, активных заявок нет.';
  
  try {
    if (applicationId) {
      const app = await prisma.application.findUnique({
        where: { id: String(applicationId) },
        include: { product: true, company: true }
      });
      if (app && (user.role === 'OPERATOR' || app.userId === user.id)) {
        const cond: any = typeof app.conditions === 'string' ? JSON.parse(app.conditions || '{}') : (app.conditions || {});
        context = [
          `Текущая заявка ${app.number}: продукт «${app.product.name}», сумма ${fmt(app.amount)} ₽, срок ${app.term} мес., цель: ${app.goal}.`,
          `Компания: ${app.company.name} (ИНН ${app.companyInn}), выручка ${fmt(app.company.revenueYear)} ₽/год, расходы ${fmt(app.company.expenseYear)} ₽/год, активна: ${app.company.active ? 'Да' : 'Нет'}.`,
          `Текущий статус: ${STATUS_LABELS[app.status as keyof typeof STATUS_LABELS] || app.status}.`,
          app.score ? `Скоринговый балл: ${app.score}/1000.` : '',
          cond && cond.amount ? `Условия решения: ${fmt(cond.amount)} ₽, ${cond.term} мес., ставка ${cond.rate}%, платёж ~${fmt(cond.monthlyPayment)} ₽/мес.` : '',
          app.decisionReason ? `Комментарий банка: ${app.decisionReason}` : ''
        ].filter(Boolean).join('\n');
      }
    } else {
      const apps = await prisma.application.findMany({
        where: user.role === 'OPERATOR' ? {} : { userId: user.id },
        include: { product: true, company: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      if (apps.length > 0) {
        const appSummaries = apps.map((app) => {
          return `- Заявка ${app.number} (${app.product.name}): сумма ${fmt(app.amount)} ₽, статус: ${STATUS_LABELS[app.status as keyof typeof STATUS_LABELS] || app.status}, компания ${app.company.name} (ИНН ${app.companyInn}), выручка ${fmt(app.company.revenueYear)} ₽/год.${app.decisionReason ? ` Причина: ${app.decisionReason}` : ''}`;
        }).join('\n');

        context = `Информация о заявках пользователя в личном кабинете Odyssey Кредит Хаб:\n${appSummaries}`;
      }
    }
  } catch (e) {
    console.error('Context build error:', e);
  }

  const system = `Ты — главный AI-советник платформы Odyssey Кредит Хаб по корпоративному финансированию. Твоя задача — профессионально и развернуто консультировать клиентов по любым вопросам финансов, экономики и кредитования, помогать подбирать идеальный кредитный продукт под специфику бизнеса, отвечать на вопросы о статусах заявок в личном кабинете, скоринге, выручке и документах. Опирайся на реальные данные личного кабинета пользователя из контекста ниже.\n\n${context}`;

  const messages = [
    { role: 'system' as const, text: system },
    { role: 'user' as const, text: String(message || '') }
  ];

  const gigachatReply = await askGigaChat(messages);
  const yandexReply = !gigachatReply ? await askYandexGPT(messages) : null;
  const reply = gigachatReply ?? yandexReply ?? offlineAssistantReply(String(message || ''), context);

  return ok({ reply, ai: Boolean(gigachatReply || yandexReply) });
}
