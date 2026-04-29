import { PrismaClient } from '@prisma/client';
const fs = require('fs');

const prisma = new PrismaClient();

async function dump() {
  console.log('🚀 Starting data dump from source database...');
  
  const data: any = {};
  
  // List of models to migrate
  const models = [
    'user', 'bike', 'wallet', 'transaction', 'ride', 
    'incident', 'reservation', 'subscription', 'pricingPlan',
    'pricingConfig', 'role', 'permission', 'rolePermission',
    'subscriptionPackage', 'subscriptionFormula', 'freeDaysRule'
  ];

  for (const model of models) {
    console.log(`📦 Dumping model: ${model}...`);
    try {
      // @ts-ignore
      data[model] = await prisma[model].findMany();
      console.log(`✅ Found ${data[model].length} records for ${model}`);
    } catch (e: any) {
      console.error(`❌ Error dumping ${model}:`, e.message);
    }
  }

  fs.writeFileSync('data_dump.json', JSON.stringify(data, null, 2));
  console.log('✨ Data dump complete! File saved to data_dump.json');
}

dump()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
