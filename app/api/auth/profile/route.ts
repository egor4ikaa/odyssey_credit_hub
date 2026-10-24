import { prisma } from '@/lib/prisma';
import { requireUser, ok, HttpError, hashPassword } from '@/lib/auth';
import { mockCompanyByInn } from '@/lib/mocks';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const { name, email, password, inn } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = String(name);
    if (email) updateData.email = String(email).toLowerCase().trim();
    if (password && typeof password === 'string' && password.trim().length > 0) {
      updateData.passwordHash = hashPassword(password);
    }

    /* Смена ИНН компании: валидация + автосоздание карточки компании из «внешних» источников */
    if (inn !== undefined && inn !== null && String(inn).trim() !== '') {
      const cleanInn = String(inn).replace(/\D/g, '');
      if (cleanInn.length !== 10 && cleanInn.length !== 12) {
        throw new HttpError(400, 'ИНН должен содержать 10 или 12 цифр');
      }
      await prisma.company.upsert({
        where: { inn: cleanInn },
        update: {},
        create: await mockCompanyByInn(cleanInn)
      });
      updateData.inn = cleanInn;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return ok({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        inn: updated.inn ?? null
      }
    });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Ошибка обновления профиля' }, { status: err.status || 500 });
  }
}
