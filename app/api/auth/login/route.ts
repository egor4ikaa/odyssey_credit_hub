import { prisma } from '@/lib/prisma';
import { verifyPassword, createSessionToken, ok, HttpError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email: String(email || '').toLowerCase().trim() } });
    if (!user || !verifyPassword(String(password || ''), user.passwordHash)) {
      throw new HttpError(401, 'Неверный email или пароль');
    }
    const res = ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    res.headers.set(
      'Set-Cookie',
      `session=${createSessionToken(user.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    return res;
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: e.status || 500 });
  }
}
