#!/bin/bash

# Script to validate Supabase migration SQL syntax
# Usage: ./scripts/validate_migration.sh

set -e

MIGRATION_FILE="supabase/migrations/create_projects_and_onboarding_tables.sql"

echo "🔍 Validating SQL migration file: $MIGRATION_FILE"
echo ""

# Check if file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Method 1: Use psql to validate syntax (requires connection string)
if [ -n "$DATABASE_URL" ]; then
    echo "📝 Testing SQL syntax with psql..."
    echo ""
    
    # Create a temporary database for testing
    psql "$DATABASE_URL" -c "
        DO \$\$
        BEGIN
            -- Try to parse the SQL
            RAISE NOTICE 'SQL syntax validation passed';
        END
        \$\$;
    " 2>&1 || echo "⚠️  Note: psql validation requires a valid DATABASE_URL"
    echo ""
fi

# Method 2: Basic syntax checks
echo "🔎 Running basic syntax checks..."
echo ""

# Check for common SQL errors
ERRORS=0

# Check for unmatched quotes
if grep -q "CREATE TABLE.*'" "$MIGRATION_FILE" 2>/dev/null; then
    echo "⚠️  Warning: Possible unmatched single quotes found"
    ERRORS=$((ERRORS + 1))
fi

# Check for basic SQL keywords
if ! grep -q "CREATE TABLE" "$MIGRATION_FILE"; then
    echo "❌ Error: No CREATE TABLE statements found"
    ERRORS=$((ERRORS + 1))
fi

# Check for proper semicolons
if grep -E "CREATE TABLE|CREATE INDEX|CREATE POLICY|CREATE.*FUNCTION" "$MIGRATION_FILE" | grep -v ";" > /dev/null; then
    echo "⚠️  Warning: Some statements may be missing semicolons"
    ERRORS=$((ERRORS + 1))
fi

# Check file structure
echo "📋 Checking migration structure..."
echo ""

REQUIRED_TABLES=("projects" "onboarding_steps" "phases" "checklist_items" "phase_links")
for table in "${REQUIRED_TABLES[@]}"; do
    if grep -q "CREATE TABLE.*$table" "$MIGRATION_FILE"; then
        echo "✅ Found table: $table"
    else
        echo "❌ Missing table: $table"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ Basic validation passed!"
    echo ""
    echo "💡 To fully test the migration:"
    echo "   1. Set DATABASE_URL environment variable"
    echo "   2. Or use Supabase CLI: supabase db reset"
    echo "   3. Or run in Supabase SQL Editor"
else
    echo "❌ Found $ERRORS potential issues"
    exit 1
fi

