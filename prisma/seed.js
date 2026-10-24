/* Синтетические тестовые данные. Пароль всех демо-аккаунтов: demo123 */
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
}

async function main() {
  const products = [
    {
      code: 'OVERDRAFT_WORKING',
      name: 'Оборотный кредит',
      tagline: 'Пополнение оборотных средств',
      description: 'Быстрое финансирование текущих операций: закупка товара, зарплаты, аренда.',
      minAmount: 100000, maxAmount: 5000000, minTerm: 3, maxTerm: 24, rate: 16.9
    },
    {
      code: 'INVESTMENT',
      name: 'Инвестиционный кредит',
      tagline: 'Оборудование и развитие',
      description: 'Долгосрочное финансирование капитальных вложений под залог приобретаемого имущества.',
      minAmount: 500000, maxAmount: 30000000, minTerm: 12, maxTerm: 60, rate: 14.5
    },
    {
      code: 'CREDIT_LINE',
      name: 'Кредитная линия',
      tagline: 'Рамочный лимит на расходы',
      description: 'Возобновляемый лимит: платите проценты только за фактически использованную сумму.',
      minAmount: 300000, maxAmount: 10000000, minTerm: 6, maxTerm: 36, rate: 15.9
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { code: p.code }, update: p, create: p });
  }

  await prisma.company.upsert({
    where: { inn: '7701234567' },
    update: {},
    create: {
      inn: '7701234567',
      name: 'ООО «Вектор»',
      okved: '47.11 — Торговля розничная преимущественно пищевыми продуктами',
      headName: 'Соколов Дмитрий Андреевич',
      revenueYear: 48000000,
      active: true,
      taxArrears: false
    }
  });

  await prisma.user.upsert({
    where: { email: 'client@demo.ru' },
    update: {},
    create: {
      email: 'client@demo.ru',
      name: 'Соколов Дмитрий Андреевич',
      passwordHash: hashPassword('demo123'),
      role: 'CLIENT'
    }
  });

  await prisma.user.upsert({
    where: { email: 'operator@demo.ru' },
    update: {},
    create: {
      email: 'operator@demo.ru',
      name: 'Петрова Анна Сергеевна',
      passwordHash: hashPassword('demo123'),
      role: 'OPERATOR'
    }
  });

  console.log('✔ Seed завершён. Демо-аккаунты: client@demo.ru / demo123, operator@demo.ru / demo123');
}

main().finally(() => prisma.$disconnect());
