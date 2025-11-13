const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Render deployment...');

try {
  // 1. Installation complète
  console.log('📦 Installing all dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  // 2. Génération Prisma Client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 3. Build TypeScript
  console.log('🏗️ Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });

  // 4. Vérification de la connexion base de données
  console.log('🔌 Testing database connection...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // 5. Seed intelligent avec plusieurs méthodes
  console.log('🌱 Seeding database...');
  
  const seedMethods = [
    () => execSync('npx prisma db seed', { stdio: 'inherit' }),
    () => execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' }),
    () => execSync('npm run db:seed', { stdio: 'inherit' }),
  ];

  let seedSuccessful = false;
  
  for (let i = 0; i < seedMethods.length; i++) {
    try {
      console.log(`🔄 Trying seed method ${i + 1}...`);
      seedMethods[i]();
      console.log('✅ Database seeded successfully!');
      seedSuccessful = true;
      break;
    } catch (seedError) {
      console.log(`⚠️ Seed method ${i + 1} failed:`, seedError.message);
    }
  }

  if (!seedSuccessful) {
    console.log('⚠️ All seed methods failed, but continuing deployment...');
    console.log('💡 You can manually seed later using: npm run db:seed');
  }

  console.log('✅ Render build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}