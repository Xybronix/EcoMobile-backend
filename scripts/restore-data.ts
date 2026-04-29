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

  // Order for deletion (dependent first to avoid FK errors)
  const deleteOrder = [...models].reverse();
  
  console.log('🧹 Clearing target tables...');
  for (const model of deleteOrder) {
    try {
      // @ts-ignore
      await prisma[model].deleteMany();
      console.log(`🗑️ Cleared ${model}`);
    } catch (e: any) {
      console.warn(`⚠️ Could not clear ${model}:`, e.message);
    }
  }

  for (const model of models) {
    if (!data[model] || data[model].length === 0) continue;
    
    console.log(`📥 Restoring model: ${model} (${data[model].length} records)...`);
    
    for (const item of data[model]) {
      try {
        // Now create is safe since table is empty
        // @ts-ignore
        await prisma[model].create({
          data: item,
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
