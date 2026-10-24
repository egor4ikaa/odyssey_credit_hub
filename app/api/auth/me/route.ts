import { currentUser, ok } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ user: null });
  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      inn: user.inn ?? null
    }
  });
}
