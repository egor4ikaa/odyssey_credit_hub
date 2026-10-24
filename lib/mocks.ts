import { prisma } from './prisma';
import fs from 'fs';
import path from 'path';

/* Локальный реестр (Open Data из базы данных):
   Поиск по ИНН происходит мгновенно в локальной БД без внешних платных API.
   Если компания не найдена, она автоматически генерируется и сохраняется в реестр. */

function hashInn(inn: string): number {
  let h = 0;
  for (const ch of inn) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

export interface BkiReport {
  found: boolean;
  creditCount: number;
  closedOnTime: number;
  activeDebt: number;
  maxDelayDays: number;
  delayCount30: number;
}

export interface EgrulReport {
  found: boolean;
  name: string;
  okved: string;
  headName: string;
  active: boolean;
  revenueYear: number;
  expenseYear: number;
  assets: number;
  equity: number;
  netProfit: number;
}

export interface FnsReport {
  found: boolean;
  taxArrears: boolean;
  arrearsAmount: number;
}

export async function mockBki(inn: string): Promise<BkiReport> {
  await sleep(400);
  const h = hashInn(inn);
  const creditCount = 1 + (h % 5);
  const maxDelayDays = [0, 0, 5, 12, 45, 90][h % 6];
  return {
    found: true,
    creditCount,
    closedOnTime: Math.max(0, creditCount - ((h >> 3) % 2)),
    activeDebt: ((h >> 4) % 9) * 250000,
    maxDelayDays,
    delayCount30: maxDelayDays >= 30 ? 1 + ((h >> 5) % 3) : 0
  };
}

export async function mockEgrul(inn: string): Promise<EgrulReport> {
  await sleep(400);
  let comp = await prisma.company.findUnique({ where: { inn } });

  if (!comp) {
    let foundData = null;
    try {
      const dataDir = path.join(process.cwd(), 'data_for_learn');
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.xml'));
        for (const file of files) {
          const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
          if (content.includes(inn)) {
            const docRegex = new RegExp(`<Документ[\\s\\S]*?ИННЮЛ="${inn}"[\\s\\S]*?<\/Документ>`, 'g');
            const match = content.match(docRegex);
            if (match && match[0]) {
              const doc = match[0];
              const nameMatch = doc.match(/НаимОрг="([^"]+)"/);
              const incomeMatch = doc.match(/СумДоход="([\d\.]+)"/);
              const expenseMatch = doc.match(/СумРасход="([\d\.]+)"/);
              if (nameMatch) {
                const name = decodeHtmlEntities(nameMatch[1]);
                const revenue = parseFloat(incomeMatch ? incomeMatch[1] : '0') || 0;
                const expenses = parseFloat(expenseMatch ? expenseMatch[1] : '0') || 0;
                const profit = revenue - expenses;
                foundData = {
                  inn,
                  name,
                  okved: '47.11 — Торговля и услуги (ФНС / ГИР БО)',
                  headName: 'Руководитель по данным ФНС',
                  revenueYear: revenue,
                  expenseYear: expenses,
                  active: revenue > 0,
                  taxArrears: profit < 0
                };
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }

    if (foundData) {
      comp = await prisma.company.create({ data: foundData });
    } else {
      const h = hashInn(inn);
      const rev = 8000000 + (h % 60) * 1000000;
      const exp = Math.round(rev * (0.7 + ((h % 30) / 100)));
      const names = ['ООО "Альянс"', 'ООО "ТехноПром"', 'ООО "Ресурс"', 'ИП Иванов И.И.', 'ООО "ТоргСервис"', 'ООО "СтройМонтаж"'];
      const name = names[h % names.length] + ` (${inn.slice(-4)})`;
      comp = await prisma.company.create({
        data: {
          inn,
          name,
          okved: '47.11 — Торговля розничная',
          headName: 'Руководителев Руководитель Руководитович',
          revenueYear: rev,
          expenseYear: exp,
          active: h % 7 !== 0,
          taxArrears: h % 5 === 0
        }
      });
    }
  }

  const netProfit = comp.revenueYear - (comp.expenseYear || 0);

  return {
    found: true,
    name: decodeHtmlEntities(comp.name),
    okved: comp.okved || '',
    headName: comp.headName || '',
    active: comp.active,
    revenueYear: comp.revenueYear,
    expenseYear: comp.expenseYear || 0,
    assets: Math.round(comp.revenueYear * 0.7),
    equity: Math.round(comp.revenueYear * 0.4),
    netProfit
  };
}

export async function mockFns(inn: string): Promise<FnsReport> {
  await sleep(300);
  const comp = await prisma.company.findUnique({ where: { inn } });
  const taxArrears = comp ? comp.taxArrears : false;
  return { found: true, taxArrears, arrearsAmount: taxArrears ? 150000 : 0 };
}

export async function mockCompanyByInn(inn: string) {
  const egrul = await mockEgrul(inn);
  const fns = await mockFns(inn);
  return {
    inn,
    name: egrul.name,
    okved: egrul.okved,
    headName: egrul.headName,
    revenueYear: egrul.revenueYear,
    expenseYear: egrul.expenseYear,
    active: egrul.active,
    taxArrears: fns.taxArrears
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
