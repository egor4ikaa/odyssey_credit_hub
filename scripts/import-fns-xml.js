/* Скрипт ультрабыстрого пакетного и асинхронного импорта XML-файлов ФНС из папки data_for_learn */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

const BATCH_DB_SIZE = 2000; // Пакет для массовой вставки в БД
const FILE_CONCURRENCY = 32; // Параллельная обработка файлов

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

async function parseFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const docRegex = /<Документ[\s\S]*?<\/Документ>/g;
    const docs = content.match(docRegex) || [];
    const results = [];

    for (const doc of docs) {
      const innMatch = doc.match(/ИННЮЛ="(\d+)"/);
      const nameMatch = doc.match(/НаимОрг="([^"]+)"/);
      const incomeMatch = doc.match(/СумДоход="([\d\.]+)"/);
      const expenseMatch = doc.match(/СумРасход="([\d\.]+)"/);

      if (innMatch && nameMatch) {
        const inn = innMatch[1];
        const name = decodeHtmlEntities(nameMatch[1]);
        const revenue = parseFloat(incomeMatch ? incomeMatch[1] : '0') || 0;
        const expenses = parseFloat(expenseMatch ? expenseMatch[1] : '0') || 0;
        const profit = revenue - expenses;

        results.push({
          inn,
          name,
          okved: '47.11 — Торговля и услуги (ГИР БО / ФНС)',
          headName: 'Руководитель по данным ФНС',
          revenueYear: revenue,
          expenseYear: expenses,
          active: revenue > 0,
          taxArrears: profit < 0
        });
      }
    }
    return results;
  } catch (e) {
    console.error(`Ошибка чтения файла ${filePath}:`, e.message);
    return [];
  }
}

async function flushBuffer(buffer) {
  if (buffer.length === 0) return;
  try {
    for (const item of buffer) {
      await prisma.company.upsert({
        where: { inn: item.inn },
        update: {
          name: item.name,
          okved: item.okved,
          headName: item.headName,
          revenueYear: item.revenueYear,
          expenseYear: item.expenseYear,
          active: item.active,
          taxArrears: item.taxArrears
        },
        create: item
      });
    }
  } catch (e) {
    console.error('Ошибка вставки в БД:', e.message);
  }
}

async function main() {
  const dataDir = path.join(__dirname, '../data_for_learn');
  if (!fs.existsSync(dataDir)) {
    console.error(`Папка ${dataDir} не найдена!`);
    return;
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.xml'));
  if (files.length === 0) {
    console.log('В папке data_for_learn нет XML файлов.');
    return;
  }

  console.log(`🚀 Найдено XML файлов: ${files.length}. Запуск ультраоптимизированного импорта...`);
  const startTime = Date.now();

  let globalBuffer = [];
  let totalImported = 0;

  for (let i = 0; i < files.length; i += FILE_CONCURRENCY) {
    const chunkFiles = files.slice(i, i + FILE_CONCURRENCY);
    const promises = chunkFiles.map((file) => parseFile(path.join(dataDir, file)));
    const chunkResults = await Promise.all(promises);

    for (const resList of chunkResults) {
      globalBuffer.push(...resList);
    }

    if (globalBuffer.length >= BATCH_DB_SIZE) {
      await flushBuffer(globalBuffer);
      totalImported += globalBuffer.length;
      console.log(`⚡ Промежуточный итог: записано компаний в БД: ${totalImported}`);
      globalBuffer = [];
    }
  }

  // Остаток буфера
  if (globalBuffer.length > 0) {
    await flushBuffer(globalBuffer);
    totalImported += globalBuffer.length;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 Импорт ${totalImported} компаний из ${files.length} файлов завершён за ${duration} сек!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
