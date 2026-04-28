import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * EcoMobile Data Migration Tool
 * 
 * This script copies data from a SOURCE database to a TARGET database.
 * Both databases must follow the EcoMobile Prisma schema.
 * 
 * Usage:
 * SOURCE_DATABASE_URL=... TARGET_DATABASE_URL=... npx ts-node scripts/db-migration-tool.ts
 */

async function migrate() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;

  if (!sourceUrl || !targetUrl) {
    console.error('❌ Error: SOURCE_DATABASE_URL and TARGET_DATABASE_URL must be set.');
    process.exit(1);
  }

  console.log('🔄 Starting data migration...');
  console.log(`Source: ${sourceUrl.split('@')[1] || 'Source DB'}`);
  console.log(`Target: ${targetUrl.split('@')[1] || 'Target DB'}`);

  const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
  const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

  try {
    // 1. Order of tables to respect dependencies (even with relationMode = prisma)
    // Basic lookup tables first
    const models = [
      'role',
      'permission',
      'rolePermission',
      'settings',
      'pricingConfig',
      'pricingPlan',
      'pricingRule',
      'pricingTier',
      'subscriptionPackage',
      'subscriptionFormula',
      'subscriptionPromotionRule',
      'freeDaysRule',
      'user',
      'userPreferences',
      'pushToken',
      'wallet',
      'bike',
      'ride',
      'incident',
      'notification',
      'chatMessage',
      'session',
      'planOverride',
      'promotion',
      'promotionPlan',
      'review',
      'reservation',
      'unlockRequest',
      'lockRequest',
      'freeDaysBeneficiary',
      'promotionPackageRelation',
      'subscription',
      'transaction',
      'maintenanceLog',
      'activityLog'
    ];

    for (const modelName of models) {
      console.log(`📦 Migrating ${modelName}...`);
      
      // @ts-ignore - access model dynamically
      const sourceModel = source[modelName];
      // @ts-ignore
      const targetModel = target[modelName];

      if (!sourceModel || !targetModel) {
        console.warn(`⚠️ Model ${modelName} not found in client, skipping.`);
        continue;
      }

      // Fetch all records from source
      const records = await sourceModel.findMany();
      console.log(`Found ${records.length} records in source.`);

      if (records.length === 0) continue;

      // Clear target for this model
      await targetModel.deleteMany({});
      
      // Batch insert into target (chunked to avoid memory issues)
      const chunkSize = 100;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await targetModel.createMany({
          data: chunk,
          skipDuplicates: true
        });
      }
      
      console.log(`✅ Successfully migrated ${records.length} records for ${modelName}.`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }
}

migrate();
