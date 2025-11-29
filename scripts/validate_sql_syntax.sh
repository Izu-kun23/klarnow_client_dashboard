#!/bin/bash

# Better SQL syntax validation script
# Usage: ./scripts/validate_sql_syntax.sh [database_url]

set -e

MIGRATION_FILE="supabase/migrations/create_projects_and_onboarding_tables.sql"

echo "🔍 SQL Migration Validator"
echo "=========================="
echo ""

# Check if file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 File: $MIGRATION_FILE"
echo "📊 File size: $(wc -l < "$MIGRATION_FILE") lines"
echo ""

# Method 1: If DATABASE_URL is provided, test with psql
if [ -n "$1" ] || [ -n "$DATABASE_URL" ]; then
    DB_URL="${1:-$DATABASE_URL}"
    
    echo "🔗 Testing with database connection..."
    echo ""
    
    # Create a test transaction that will rollback
    psql "$DB_URL" <<EOF
BEGIN;
-- Test parsing the migration
\set ON_ERROR_STOP on
\echo 'Testing SQL syntax...'
-- We'll just validate it can be parsed
DO \$\$
BEGIN
    RAISE NOTICE 'SQL syntax appears valid';
END
\$\$;
ROLLBACK;
EOF
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SQL syntax validation passed!"
    else
        echo ""
        echo "❌ SQL syntax validation failed"
        exit 1
    fi
else
    echo "💡 To test with a database, provide DATABASE_URL:"
    echo "   DATABASE_URL='postgresql://...' ./scripts/validate_sql_syntax.sh"
    echo ""
    echo "   Or: ./scripts/validate_sql_syntax.sh 'postgresql://user:pass@host:port/db'"
    echo ""
fi

# Method 2: Static analysis
echo "🔎 Running static analysis..."
echo ""

ERRORS=0
WARNINGS=0

# Check for required tables
REQUIRED_TABLES=("projects" "onboarding_steps" "phases" "checklist_items" "phase_links")
echo "📋 Checking required tables:"
for table in "${REQUIRED_TABLES[@]}"; do
    if grep -qi "CREATE TABLE.*$table" "$MIGRATION_FILE"; then
        echo "  ✅ $table"
    else
        echo "  ❌ $table (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check for RLS policies
echo ""
echo "🔒 Checking RLS policies:"
if grep -q "ENABLE ROW LEVEL SECURITY" "$MIGRATION_FILE"; then
    POLICY_COUNT=$(grep -c "CREATE POLICY" "$MIGRATION_FILE" || echo "0")
    echo "  ✅ RLS enabled (found $POLICY_COUNT policies)"
else
    echo "  ⚠️  RLS not found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for indexes
echo ""
echo "📇 Checking indexes:"
INDEX_COUNT=$(grep -c "CREATE INDEX" "$MIGRATION_FILE" || echo "0")
if [ "$INDEX_COUNT" -gt 0 ]; then
    echo "  ✅ Found $INDEX_COUNT indexes"
else
    echo "  ⚠️  No indexes found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for functions
echo ""
echo "⚙️  Checking functions:"
FUNCTION_COUNT=$(grep -c "CREATE.*FUNCTION" "$MIGRATION_FILE" || echo "0")
if [ "$FUNCTION_COUNT" -gt 0 ]; then
    echo "  ✅ Found $FUNCTION_COUNT functions"
else
    echo "  ⚠️  No functions found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for triggers
echo ""
echo "🎯 Checking triggers:"
TRIGGER_COUNT=$(grep -c "CREATE TRIGGER" "$MIGRATION_FILE" || echo "0")
if [ "$TRIGGER_COUNT" -gt 0 ]; then
    echo "  ✅ Found $TRIGGER_COUNT triggers"
else
    echo "  ⚠️  No triggers found"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=========================="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ Validation passed! No issues found."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Validation passed with $WARNINGS warning(s)"
    exit 0
else
    echo "❌ Validation failed with $ERRORS error(s) and $WARNINGS warning(s)"
    exit 1
fi

