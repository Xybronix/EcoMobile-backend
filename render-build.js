const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Render deployment...');

try {
  // 1. Installation des dépendances (y compris devDependencies)
  console.log('📦 Installing all dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // 2. Installation spécifique des types manquants au cas où
  console.log('📦 Installing missing type definitions...');
  try {
    execSync('npm install --save-dev @types/pg @types/swagger-jsdoc @types/jsonwebtoken @types/morgan @types/swagger-ui-express @types/bcryptjs @types/nodemailer', { stdio: 'inherit' });
  } catch (typeError) {
    console.log('⚠️ Some type installations failed, continuing...');
  }

  // 3. Compilation TypeScript
  // console.log('📦 Compiling TypeScript...');
  // execSync('npx tsc', { stdio: 'inherit' });

  // 4. Génération Prisma Client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 5. Push du schema
  console.log('🗄️ Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  // 6. Seed de la base (optionnel)
  console.log('🌱 Seeding database...');
  try {
    execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
  } catch (seedError) {
    console.log('⚠️ Seed failed, continuing deployment...', seedError.message);
  }

  console.log('✅ Render build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}