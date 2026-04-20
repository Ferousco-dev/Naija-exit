#!/bin/bash
# 🚀 Naija Exit - Quick Setup Script
# Run this after cloning to get everything ready

echo "🌍 Naija Exit - Quick Setup"
echo "=============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Copy env template
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your API keys:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - VITE_CONVERTAPI_SECRET"
    echo "   - VITE_GROQ_API_KEY"
else
    echo "✅ .env.local already exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Installing..."
    npm install -g supabase
    echo "✅ Supabase CLI installed"
else
    echo "✅ Supabase CLI found"
fi
echo ""

echo "🎯 Setup complete! Next steps:"
echo "================================"
echo ""
echo "1. Edit .env.local with your API keys:"
echo "   nano .env.local"
echo ""
echo "2. Set up Supabase database:"
echo "   Read: SUPABASE_SETUP.md"
echo ""
echo "3. Deploy Edge Function:"
echo "   supabase functions deploy fetch-fx-rates --no-verify"
echo ""
echo "4. Start development:"
echo "   npm run dev"
echo ""
echo "5. Visit http://localhost:5174"
echo ""
echo "📚 Documentation:"
echo "   - SUPABASE_SETUP.md - Database & Edge Function guide"
echo "   - DEPLOYMENT.md - Production deployment steps"
echo "   - README.md - Full feature documentation"
echo ""
echo "✨ Happy Japa planning! 🚀"
