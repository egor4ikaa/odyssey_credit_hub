#!/bin/sh
set -e
echo "Ожидаем PostgreSQL..."
until node -e "const c=new (require('@prisma/client').PrismaClient)();c.\$connect().then(()=>{console.log('ok');process.exit(0)}).catch(()=>process.exit(1))" ; do sleep 2; done
echo "Применяем схему и сид..."
npx prisma db push --skip-generate
node prisma/seed.js
echo "Запуск..."
node server.js