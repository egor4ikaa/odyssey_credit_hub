export const dynamic = 'force-dynamic';

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
  return res;
}
