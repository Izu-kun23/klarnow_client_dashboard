# Testing Supabase Migrations

This guide shows how to test your SQL migration files in the terminal.

## Quick Test (No Database Required)

Run the static validation script:

```bash
./scripts/validate_sql_syntax.sh
```

This checks:
- ✅ All required tables are present
- ✅ RLS policies are defined
- ✅ Indexes are created
- ✅ Functions and triggers exist

## Test with Database Connection

### Option 1: Using psql with DATABASE_URL

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run validation
./scripts/validate_sql_syntax.sh
```

### Option 2: Using Supabase CLI (Recommended)

First, install Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Or download from: https://github.com/supabase/cli/releases
```

Then test locally:

```bash
# Initialize Supabase (if not already done)
supabase init

# Start local Supabase instance
supabase start

# Apply migration to local database
supabase migration up

# Or reset and apply all migrations
supabase db reset

# Check migration status
supabase migration list
```

### Option 3: Test in Supabase Dashboard

1. Copy the contents of `supabase/migrations/create_projects_and_onboarding_tables.sql`
2. Go to your Supabase project dashboard
3. Navigate to **SQL Editor**
4. Paste the SQL
5. Click **Run** to execute

## Test with psql Directly

If you have a PostgreSQL connection:

```bash
# Test syntax (dry run)
psql $DATABASE_URL -c "
BEGIN;
\i supabase/migrations/create_projects_and_onboarding_tables.sql
ROLLBACK;
"
```

## Available Scripts

### `scripts/validate_sql_syntax.sh`
Comprehensive validation with static analysis and optional database testing.

```bash
./scripts/validate_sql_syntax.sh
./scripts/validate_sql_syntax.sh "postgresql://user:pass@host:port/db"
```

### `scripts/validate_migration.sh`
Basic validation without database connection.

```bash
./scripts/validate_migration.sh
```

### `scripts/test_with_supabase.sh`
Test using Supabase CLI (requires CLI installation).

```bash
./scripts/test_with_supabase.sh
```

## Manual Testing Steps

1. **Check SQL syntax:**
   ```bash
   # Using pg_format (if installed)
   pg_format supabase/migrations/create_projects_and_onboarding_tables.sql
   ```

2. **Validate table structure:**
   ```bash
   grep "CREATE TABLE" supabase/migrations/create_projects_and_onboarding_tables.sql
   ```

3. **Check for common errors:**
   ```bash
   # Missing semicolons
   grep -E "CREATE (TABLE|INDEX|POLICY)" supabase/migrations/create_projects_and_onboarding_tables.sql | grep -v ";"
   
   # Unmatched quotes
   grep -E "'.*'" supabase/migrations/create_projects_and_onboarding_tables.sql
   ```

## Testing Checklist

Before applying migration to production:

- [ ] Run static validation: `./scripts/validate_sql_syntax.sh`
- [ ] Test in local Supabase: `supabase db reset`
- [ ] Verify all tables are created
- [ ] Check RLS policies are working
- [ ] Test triggers and functions
- [ ] Verify indexes are created
- [ ] Test with sample data

## Troubleshooting

### "psql: command not found"
Install PostgreSQL client tools:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### "Supabase CLI not found"
Install Supabase CLI:
```bash
brew install supabase/tap/supabase
```

### Connection errors
- Check your `DATABASE_URL` format
- Ensure database is accessible
- Verify credentials are correct

## Next Steps

After validation passes:

1. Apply to staging environment first
2. Test all functionality
3. Apply to production
4. Monitor for any issues

