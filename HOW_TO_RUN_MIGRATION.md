# 🚀 How to Run the Database Migration

## The Problem
You're seeing "Database schema not set up" errors because the `projects` and `onboarding_steps` tables don't exist yet.

## The Solution
Run this SQL migration in your Supabase dashboard.

---

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Select Your Project
Click on your Klarnow project

### 3. Open SQL Editor
- Click on **"SQL Editor"** in the left sidebar
- Click **"New query"** button

### 4. Copy the Migration SQL
Open this file: `supabase/migrations/create_minimal_onboarding_tables.sql`

Copy **ALL** the contents (Cmd+A, Cmd+C)

### 5. Paste and Run
- Paste the SQL into the SQL Editor (Cmd+V)
- Click the **"Run"** button (or press Cmd+Enter)

### 6. Verify Success
You should see:
```
Success. No rows returned
```

---

## ✅ What This Migration Does

Creates 2 essential tables:

1. **`projects`** table
   - Stores project info (user_id, kit_type, onboarding_percent, etc.)
   - One project per user per kit type

2. **`onboarding_steps`** table  
   - Stores ALL onboarding form data
   - Each step (1, 2, 3) saves to this table immediately
   - Form data is stored in the `fields` JSONB column

---

## 🎯 After Running the Migration

All 3 onboarding steps will automatically save to the database:
- ✅ Step 1 saves when you click "Save and Continue" or "Continue"
- ✅ Step 2 saves when you click "Save and Continue" or "Continue"  
- ✅ Step 3 saves when you click "Finish onboarding"

**No more "Database schema not set up" errors!**

---

## ❌ If You Get Errors

### Error: "relation already exists"
**Meaning:** Tables already exist (someone already ran the migration)

**Solution:** This is fine! The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run again.

### Error: "permission denied"
**Meaning:** You need admin access to run migrations

**Solution:** Make sure you're logged in as a project owner/admin

### Other Errors?
Share the exact error message and I'll help you fix it!

---

## 📝 Need Help?

If you're still seeing errors after running the migration:
1. Check your server console logs (where you run `npm run dev`)
2. Look for specific error messages about missing tables/columns
3. Share those error messages with me

