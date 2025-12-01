# Prisma Setup Guide

## Prisma Schema Implementation Complete

The Prisma schema has been created with all required models:

- **OnboardingAnswer** - Stores onboarding form data as JSON
- **Client** - Main client record with project information
- **ClientPhaseState** - Dynamic phase state per client
- **QuizSubmission** - Email-based login lookup

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
DATABASE_URL="mysql://root:LhxtqbFXxONStbSWyYeJHSjyrTkApjTR@trolley.proxy.rlwy.net:40004/railway"
```

### 2. Generate Prisma Client

The Prisma client has already been generated. If you need to regenerate:

```bash
npx prisma generate
```

### 3. Run Database Migration

Once the DATABASE_URL is set in `.env.local`, run:

```bash
npx prisma migrate dev --name init
```

This will create all tables in your MySQL database.

### 4. Verify Migration

To verify the migration was successful:

```bash
npx prisma studio
```

This opens Prisma Studio where you can view and edit your database.

## Schema Details

### Enums

- **KitType**: LAUNCH, GROWTH
- **Status**: NOT_STARTED, IN_PROGRESS, WAITING_ON_CLIENT, DONE

### Models

All models use UUID for primary keys and include proper indexes for performance.

The schema matches the UX documentation requirements:
- Static phase structure stays in frontend code (`lib/phase-structure.ts`)
- Database only stores dynamic state (status, checklist completion)
- Onboarding answers stored as JSON for flexibility

## Next Steps

After setting up the database:

1. Update API routes to use Prisma instead of Supabase
2. Test database operations
3. Deploy with proper environment variables

