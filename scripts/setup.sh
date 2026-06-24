#!/bin/bash

set -e

echo "🚀 Setting up Arya IDE..."

echo "📦 Installing dependencies..."
npm install

echo "🔧 Generating database schema..."
npx drizzle-kit generate

echo "🗄️ Pushing schema to database..."
npx drizzle-kit push

echo "🌱 Seeding database..."
npx tsx scripts/seed.ts

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@aryadev.io"
echo "  Password: admin123"
