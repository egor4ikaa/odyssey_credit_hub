import { prisma } from '@/lib/prisma';
import { ok } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { minAmount: 'asc' } });
  return ok({ products });
}
