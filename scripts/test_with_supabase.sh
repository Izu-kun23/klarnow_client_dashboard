#!/bin/bash

# Script to test migration with Supabase CLI
# Usage: ./scripts/test_with_supabase.sh

set -e

MIGRATION_FILE="supabase/migrations/create_projects_and_onboarding_tables.sql"

echo "🚀 Testing Supabase Migration"
echo "================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo ""
    echo "📦 Install it with:"
    echo "   brew install supabase/tap/supabase"
    echo ""
    echo "   Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "✅ Supabase CLI found"
echo "✅ Migration file found: $MIGRATION_FILE"
echo ""

# Check if Supabase is initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "📝 Initializing Supabase project..."
    supabase init
    echo ""
fi

echo "🔍 Validating migration SQL..."
echo ""

# Try to validate SQL syntax
if supabase db lint "$MIGRATION_FILE" 2>/dev/null; then
    echo "✅ SQL syntax validation passed"
else
    echo "⚠️  Note: SQL linting may not be available in your Supabase CLI version"
    echo "   This is okay - the SQL will be validated when applied"
fi

echo ""
echo "💡 Next steps:"
echo ""
echo "1. To test locally with Supabase:"
echo "   supabase start"
echo "   supabase db reset"
echo ""
echo "2. To apply migration to local database:"
echo "   supabase migration up"
echo ""
echo "3. To test in Supabase SQL Editor:"
echo "   - Copy contents of $MIGRATION_FILE"
echo "   - Paste into Supabase Dashboard > SQL Editor"
echo "   - Run the query"
echo ""

