#!/bin/bash
set -e

echo "🚀 Starting EcoMobile Backend Entrypoint..."

# Ensure we have the latest prisma client generated for the current platform
# AUTO-DETECT PROVIDER FROM DATABASE_URL
echo "🔍 Detecting database provider from DATABASE_URL..."
if [[ "$DATABASE_URL" == postgresql://* ]] || [[ "$DATABASE_URL" == postgres://* ]]; then
    echo "🐘 Setting provider to postgresql"
    sed -i '/datasource db {/,/}/ s/provider = "[^"]*"/provider = "postgresql"/' prisma/schema.prisma
elif [[ "$DATABASE_URL" == mysql://* ]]; then
    echo "🐬 Setting provider to mysql"
    sed -i '/datasource db {/,/}/ s/provider = "[^"]*"/provider = "mysql"/' prisma/schema.prisma
elif [[ "$DATABASE_URL" == file:* ]] || [[ "$DATABASE_URL" == *.db ]]; then
    echo "📁 Setting provider to sqlite"
    sed -i '/datasource db {/,/}/ s/provider = "[^"]*"/provider = "sqlite"/' prisma/schema.prisma
else
    echo "ℹ️ Using default provider from schema.prisma"
fi

echo "🔄 Generating Prisma client..."
npx prisma generate

# Sync the schema with the current database type
# We use db push to bypass the migration history, which is ideal for hybrid setups
echo "🗄️ Syncing database schema (Hybrid Mode)..."
if [ -n "$DATABASE_URL" ]; then
    npx prisma db push
else
    echo "⚠️ DATABASE_URL not set, skipping schema sync."
fi

# Run the seed script
echo "🌱 Running database seed..."
npm run db:seed

# Execute the main command
echo "✅ Setup complete. Starting server..."
exec "$@"
