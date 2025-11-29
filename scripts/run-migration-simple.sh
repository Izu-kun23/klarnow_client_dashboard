#!/bin/bash

# Simple script to help run the migration
# Usage: ./scripts/run-migration-simple.sh

echo "🚀 Running Database Migration"
echo "=============================="
echo ""

MIGRATION_FILE="supabase/migrations/create_projects_and_onboarding_tables.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
  echo "✅ psql is installed"
  echo ""
  echo "💡 To run the migration with psql:"
  echo "   1. Get your database connection string from Supabase Dashboard"
  echo "   2. Settings > Database > Connection string"
  echo "   3. Run:"
  echo "      psql 'YOUR_CONNECTION_STRING' -f $MIGRATION_FILE"
  echo ""
else
  echo "ℹ️  psql not found. Install with: brew install postgresql"
  echo ""
fi

echo "📋 Recommended: Use Supabase Dashboard"
echo "───────────────────────────────────────"
echo "1. Open: https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to: SQL Editor"
echo "4. Click: New query"
echo "5. Copy contents of: $MIGRATION_FILE"
echo "6. Paste and click: Run"
echo ""

# Open the file
echo "Opening migration file..."
open "$MIGRATION_FILE" 2>/dev/null || code "$MIGRATION_FILE" 2>/dev/null || echo "Please open: $MIGRATION_FILE"

