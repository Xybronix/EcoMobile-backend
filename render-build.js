const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Render deployment...');

try {
  // 1. Compilation TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // 2. Génération Prisma Client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 3. Push du schema (pour Railway MySQL)
  console.log('🗄️ Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // 4. Seed de la base
  console.log('🌱 Seeding database...');
  execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });

  console.log('✅ Render build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}