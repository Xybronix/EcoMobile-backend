import { PrismaClient } from '@prisma/client';
const fs = require('fs');

const prisma = new PrismaClient();

async function restore() {
  if (!fs.existsSync('data_dump.json')) {
    console.error('❌ data_dump.json not found!');
    return;
  }

  const data = JSON.parse(fs.readFileSync('data_dump.json', 'utf8'));
  console.log('🚀 Starting data restoration to target database...');

  // Order matters for relations (independent first)
  const models = [
    'role', 'permission', 'rolePermission',
    'user', 'bike', 'wallet', 'pricingConfig', 'pricingPlan',
    'subscriptionPackage', 'subscriptionFormula', 'freeDaysRule',
    'subscription', 'transaction', 'ride', 'incident', 'reservation'
  ];

  for (const model of models) {
    if (!data[model] || data[model].length === 0) continue;
    
    console.log(`📥 Restoring model: ${model} (${data[model].length} records)...`);
    
    for (const item of data[model]) {
      try {
        // We use upsert to avoid duplicates
        // @ts-ignore
        await prisma[model].upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      } catch (e: any) {
        console.error(`❌ Error restoring ${model} (ID: ${item.id}):`, e.message);
      }
    }
  }

  console.log('✨ Data restoration complete!');
}

restore()
  .catch((e: any) => console.error(e))
  .finally(async () => await prisma.$disconnect());
