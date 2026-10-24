import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken, ok, HttpError, validatePassword, validateEmail, validateFullName, validateInn } from '@/lib/auth';
import { mockCompanyByInn } from '@/lib/mocks';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, inn, companyName, revenueYear } = body;

    if (!name || !email || !password) {
      throw new HttpError(400, 'Заполните обязательные поля (Имя, Email, Пароль)');
    }

    const nameErr = validateFullName(name);
    if (nameErr) throw new HttpError(400, nameErr);

    const emailErr = validateEmail(email);
    if (emailErr) throw new HttpError(400, emailErr);

    const pwErr = validatePassword(password);
    if (pwErr) throw new HttpError(400, pwErr);

    if (inn) {
      const cleanInn = String(inn).replace(/\D/g, '');
      if (cleanInn.length !== 10 && cleanInn.length !== 12) {
        throw new HttpError(400, 'ИНН должен содержать ровно 10 или 12 цифр');
      }
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw new HttpError(400, 'Пользователь с таким email уже зарегистрирован');
    }

    const passwordHash = hashPassword(password);

    /* ИНН сохраняем в профиле пользователя: подставляется в заявки автоматически */
    let userInn: string | null = null;
    if (inn) {
      const cleanInn = String(inn).replace(/\D/g, '');
      if (cleanInn.length === 10 || cleanInn.length === 12) {
        userInn = cleanInn;
        const seed = await mockCompanyByInn(cleanInn);
        await prisma.company.upsert({
          where: { inn: cleanInn },
          update: {
            name: companyName ? String(companyName) : undefined,
            revenueYear: revenueYear ? Number(revenueYear) : undefined
          },
          create: {
            ...seed,
            name: companyName ? String(companyName) : seed.name,
            revenueYear: revenueYear ? Number(revenueYear) : seed.revenueYear
          }
        });
      }
    }

    const user = await prisma.user.create({
      data: {
        name: String(name),
        email: cleanEmail,
        passwordHash,
        role: 'CLIENT',
        inn: userInn
      }
    });

    const res = ok(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role, inn: user.inn ?? null } },
      201
    );
    res.headers.set(
      'Set-Cookie',
      `session=${createSessionToken(user.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    return res;
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
