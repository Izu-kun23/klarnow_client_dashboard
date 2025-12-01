# Onboarding Pre-Fill Flow

## Overview

After a user inputs their email, the system automatically fetches their quiz submission data from the `quiz_submissions` table and pre-fills matching fields in the onboarding forms. This prevents users from re-entering information they've already provided.

## Flow Diagram

```
User Enters Email (Login)
         ↓
POST /api/users/lookup
         ↓
Fetches quiz_submissions by email
         ↓
User Logs In → Email stored in localStorage
         ↓
User Navigates to Onboarding Step 1
         ↓
Step Form Component Mounts
         ↓
Fetches quiz submission via GET /api/quiz-submissions/my-submission?email=...
         ↓
Maps quiz fields to onboarding fields
         ↓
Pre-fills form (only empty fields)
         ↓
User sees pre-filled data, can edit if needed
```

## Implementation Details

### 1. Login Flow - Email Association

**File:** `src/app/api/users/lookup/route.ts`

When a user enters their email:
1. System checks `quiz_submissions` table for that email
2. If found, returns the latest quiz submission
3. Email is stored in localStorage for later use

**Key Code:**
```typescript
// Check quiz_submissions table for the email - REQUIRED for login
const { data: quizSubmissions } = await supabaseAdmin
  .from('quiz_submissions')
  .select('*')
  .eq('email', emailLower)
  .order('created_at', { ascending: false })

// Get the latest quiz submission
const latestQuizSubmission = quizSubmissions[0]
```

### 2. Onboarding Forms - Pre-Fill Logic

All onboarding step forms follow this pattern:

#### Step 1 Forms

**Files:**
- `src/components/launch-kit/onboarding/Step1Form.tsx` (lines 58-99)
- `src/components/growth-kit/onboarding/Step1Form.tsx` (lines 68-117)

**What happens:**
1. Form component mounts
2. Fetches quiz submission by email from Supabase
3. Maps quiz fields to onboarding fields using `mapQuizToOnboardingFields()`
4. Pre-fills all matching fields (only if empty)

**Fields Pre-filled (Launch Kit):**
- `business_name` ← `brand_name`
- `name_and_role` ← `full_name`
- `contact_email` ← `email`
- `phone_whatsapp` ← `phone_number`
- `what_you_sell` ← `brand_style` + `brand_goals`
- `who_is_this_for` ← `audience`

**Fields Pre-filled (Growth Kit):**
- `business_name` ← `brand_name`
- `name_and_role` ← `full_name`
- `current_website_url` ← `online_presence` (if URL)
- `who_offer_for` ← `audience`
- `typical_timeline` ← `timeline` (if descriptive)

#### Step 2 Forms

**Files:**
- `src/components/launch-kit/onboarding/Step2Form.tsx` (lines 68-98)
- `src/components/growth-kit/onboarding/Step2Form.tsx` (lines 88-118)

**What happens:**
1. Fetches quiz submission by email
2. Pre-fills `ideal_client_description` from `audience`

**Note:** Currently only pre-fills one field. Could be enhanced to map more quiz data.

#### Step 3 Forms

**Files:**
- `src/components/launch-kit/onboarding/Step3Form.tsx` (lines 55-86)
- `src/components/growth-kit/onboarding/Step3Form.tsx`

**What happens:**
- Launch Kit: Pre-fills `contact_form_email` from quiz `email`
- Growth Kit: Currently no pre-fill (could be enhanced)

### 3. Mapping Function

**File:** `src/utils/fetchQuizSubmission.ts`

**Function:** `mapQuizToOnboardingFields(quizSubmission, kitType)`

**Purpose:** Intelligently maps quiz submission fields to onboarding form fields based on kit type.

**Mapping Logic:**
- Direct mappings (common to both kits)
- Kit-specific mappings (Launch vs Growth)
- Smart field matching (e.g., URL detection, array joining)

### 4. API Endpoint

**File:** `src/app/api/quiz-submissions/my-submission/route.ts`

**Endpoint:** `GET /api/quiz-submissions/my-submission?email=...`

**What it does:**
- Fetches latest quiz submission for given email
- Returns full quiz submission object
- Handles errors gracefully

## Current Pre-Fill Coverage

### ✅ Step 1 (Comprehensive)
- Launch Kit: 6 fields pre-filled
- Growth Kit: 5+ fields pre-filled

### ⚠️ Step 2 (Limited)
- Both Kits: Only `ideal_client_description` pre-filled
- **Enhancement Opportunity:** Could map more quiz data

### ⚠️ Step 3 (Minimal)
- Launch Kit: Only `contact_form_email` pre-filled
- Growth Kit: No pre-fill
- **Enhancement Opportunity:** Could map more quiz data

## Key Features

### 1. Non-Destructive Pre-Fill
- Only pre-fills **empty** fields
- Never overwrites user input
- User can edit pre-filled data

### 2. Smart Field Matching
- Handles different data formats
- Joins arrays into text
- Detects URLs and formats them

### 3. Kit-Specific Logic
- Different mappings for Launch vs Growth Kit
- Respects kit-specific field requirements

## Example Flow

1. **User enters email:** `john@example.com`
2. **System fetches:** Latest quiz submission for `john@example.com`
3. **Quiz data found:**
   ```json
   {
     "brand_name": "John's Business",
     "full_name": "John Doe",
     "email": "john@example.com",
     "phone_number": "+1234567890",
     "audience": ["Small business owners", "Entrepreneurs"],
     "brand_style": "Professional and modern"
   }
   ```
4. **Step 1 form loads:**
   - `business_name` = "John's Business" ✅
   - `name_and_role` = "John Doe" ✅
   - `contact_email` = "john@example.com" ✅
   - `phone_whatsapp` = "+1234567890" ✅
   - `who_is_this_for` = "Small business owners, Entrepreneurs" ✅
   - `what_you_sell` = "Professional and modern" ✅

5. **User sees pre-filled form** and can edit if needed

## Database Schema

### quiz_submissions Table

Key fields used for pre-filling:
- `email` - User's email
- `brand_name` - Business name
- `full_name` - User's name
- `phone_number` - Contact number
- `audience` - Target audience (array)
- `brand_style` - Brand description
- `brand_goals` - Goals (array)
- `online_presence` - Website URL
- `timeline` - Project timeline
- `preferred_kit` - Kit type preference

## Future Enhancements

### Potential Improvements:

1. **Enhanced Step 2 Pre-Fill:**
   - Map `brand_style` to voice words
   - Map `brand_goals` to problems/outcomes
   - Map testimonials if available

2. **Enhanced Step 3 Pre-Fill:**
   - Map `online_presence` to domain/platform fields
   - Pre-fill communication preferences if available

3. **Cross-Step Intelligence:**
   - Remember user preferences across steps
   - Suggest fields based on previous answers

## Testing

To test pre-fill functionality:

1. **Create a quiz submission:**
   ```sql
   INSERT INTO quiz_submissions (email, brand_name, full_name, ...)
   VALUES ('test@example.com', 'Test Business', 'Test User', ...);
   ```

2. **Login with that email**

3. **Navigate to onboarding Step 1**

4. **Verify fields are pre-filled**

5. **Edit a field and verify it's not overwritten**

## Summary

✅ **System is fully implemented:**
- Email is associated with quiz submission on login
- All onboarding forms fetch quiz data
- Fields are intelligently mapped and pre-filled
- Non-destructive (only fills empty fields)
- Kit-specific logic applied

The onboarding flow successfully prevents users from re-entering information they've already provided in the quiz! 🎉

