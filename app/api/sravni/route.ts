import { NextRequest } from 'next/server';
import { ok } from '@/lib/auth';
import { fetchSravniOffers } from '@/lib/sravni';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category') || undefined;
  const offers = await fetchSravniOffers(category);
  const categories = ['Все', 'Бизнес-кредит', 'Кредит наличными', 'Рефинансирование', 'Залоговый', 'На любые цели'];
  return ok({ offers, categories, syncedAt: new Date().toISOString(), partner: 'Sravni.ru' });
}
