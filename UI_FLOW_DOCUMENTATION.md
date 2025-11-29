# Klarnow Client Dashboard - UI Flow Documentation

## Overview

This document maps the complete user interface flow for the Klarnow Client Dashboard, from initial login through all dashboard pages, including navigation patterns, state transitions, and user interactions.

**Purpose:** Provide a comprehensive guide to the UI flow, user journeys, conditional rendering logic, and interaction patterns for developers and stakeholders.

---

## Table of Contents

1. [Overview & User Journey Map](#1-overview--user-journey-map)
2. [Authentication & Initial Access Flow](#2-authentication--initial-access-flow)
3. [Home Page Flow](#3-home-page-flow)
4. [Launch Kit Flow](#4-launch-kit-flow)
5. [Growth Kit Flow](#5-growth-kit-flow)
6. [Support Page Flow](#6-support-page-flow)
7. [Navigation & Global Components](#7-navigation--global-components)
8. [State Transitions & Status Flow](#8-state-transitions--status-flow)
9. [Error States & Edge Cases](#9-error-states--edge-cases)
10. [User Interaction Patterns](#10-user-interaction-patterns)

---

## 1. Overview & User Journey Map

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         ENTRY POINT                              │
│                         Root Route (/)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Authentication │
                    │   Check State   │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌──────────────┐
        │ Not Authenticated      │ Authenticated │
        │   Login Page  │         │   Redirect   │
        └───────┬───────┘         └──────┬───────┘
                │                        │
                │                        ▼
                │              ┌──────────────────┐
                │              │  Check Project   │
                │              │     Exists        │
                │              └────────┬─────────┘
                │                       │
                │            ┌──────────┴──────────┐
                │            │                     │
                │            ▼                     ▼
                │    ┌──────────────┐    ┌──────────────┐
                │    │ Project Exists│    │ No Project   │
                │    │   Home Page   │    │ Initialize    │
                │    └──────┬───────┘    └──────┬───────┘
                │           │                   │
                │           │                   │
                └───────────┴───────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌──────────────┐         ┌──────────────┐
        │  Launch Kit  │         │  Growth Kit   │
        │    Flow      │         │    Flow       │
        └──────────────┘         └──────────────┘
```

### Entry Points

1. **Root Route (`/`)**
   - Default entry point for all users
   - Handles authentication state check
   - Redirects based on authentication status

2. **Direct Route Access**
   - Users can directly access routes like `/home`, `/launch-kit`, etc.
   - All routes check authentication and project existence
   - Unauthenticated users are redirected to `/`

### Exit Points

1. **Sign Out**
   - Clears authentication session
   - Redirects to login page (`/`)

2. **Session Expiration**
   - Automatic redirect to login on session expiry

### Key Decision Points

1. **Authentication Status**
   - Determines if user sees login page or dashboard
   - Route: `/` → Login or Redirect

2. **Project Existence**
   - Determines if user sees initialization prompt or dashboard
   - Route: `/home` → Initialize Project or Home Content

3. **Kit Type Selection**
   - Determines which onboarding flow to show
   - Routes: `/launch-kit` vs `/growth-kit`
   - Set during signup or project initialization

4. **Onboarding Step Completion**
   - Determines which steps are unlocked
   - Steps 2 and 3 locked until previous step is `DONE`

5. **Current Phase Status**
   - Determines which phase is expanded in build tracker
   - First phase with `IN_PROGRESS` or `WAITING_ON_CLIENT` is expanded

---

## 2. Authentication & Initial Access Flow

### 2.1 Login Page (`/`)

**Route:** `src/app/page.tsx`

**Entry Conditions:**
- User is not authenticated
- User session expired
- User manually navigated to `/`

**UI Components:**
- Login form with email and password fields
- Sign up option with kit type selection
- Error messages for failed authentication

**User Flow:**

```
User lands on root route (/)
    │
    ▼
Check authentication status
    │
    ├─── Authenticated? ──YES──> Redirect to /home
    │
    └─── NO ──> Show LoginPageMock component
            │
            ├─── User clicks "Sign In"
            │    │
            │    ├─── Valid credentials? ──YES──> Authenticate → Redirect to /home
            │    │
            │    └─── NO ──> Show error message
            │
            └─── User clicks "Sign Up"
                 │
                 ├─── Fill email, password, select kit type
                 │
                 ├─── Submit form
                 │
                 ├─── Create user account
                 │
                 ├─── Initialize project with selected kit_type
                 │
                 └─── Redirect to appropriate onboarding flow
                      │
                      ├─── Launch Kit → /launch-kit/onboarding/step-1
                      │
                      └─── Growth Kit → /growth-kit/onboarding/step-1
```

**Kit Type Selection During Signup:**

- **Launch Kit:** 3-page site in 14 days
- **Growth Kit:** 4-6 page funnel with emails in 14 days

**Component:** `src/components/login/LoginPageMock.tsx`

**Key Features:**
- Email/password authentication (mock using localStorage)
- Kit type selection dropdown/radio buttons
- Form validation
- Error handling for invalid credentials

**Redirect Logic:**
- After successful login/signup → `/home`
- If project exists → `/home` shows project status
- If no project → `/home` shows initialization prompt

---

### 2.2 Project Initialization Flow

**Trigger:** User is authenticated but has no project

**Location:** `/home` page shows `InitializeProjectPrompt` component

**User Flow:**

```
User on /home with no project
    │
    ▼
Show InitializeProjectPrompt component
    │
    ├─── Display kit type selection
    │    - Launch Kit option
    │    - Growth Kit option
    │
    ├─── User selects kit type
    │
    ├─── User clicks "Initialize Project"
    │
    ├─── Create project record
    │    - Set kit_type
    │    - Set onboarding_percent = 0
    │
    ├─── Initialize onboarding steps (3 steps)
    │    - Step 1, 2, 3 with default values
    │    - Status: NOT_STARTED
    │
    ├─── Initialize phases (4 phases)
    │    - Phase 1, 2, 3, 4 with default values
    │    - Status: NOT_STARTED
    │
    └─── Redirect to appropriate onboarding
         │
         ├─── Launch Kit → /launch-kit/onboarding/step-1
         │
         └─── Growth Kit → /growth-kit/onboarding/step-1
```

**Component:** `src/components/home/InitializeProjectPrompt.tsx`

**API Call:** `POST /api/projects/initialize`
- Body: `{ kit_type: 'LAUNCH' | 'GROWTH' }`

---

## 3. Home Page Flow

### 3.1 Entry Conditions

**Route:** `src/app/home/page.tsx`

**Prerequisites:**
1. User must be authenticated
2. If no project exists, show initialization prompt

**Access Control:**
- Unauthenticated users → Redirect to `/`
- Authenticated users → Show home content or initialization prompt

### 3.2 Widget Display Logic

**Component:** `src/components/home/HomePageContent.tsx`

**Data Source:** `project` object from `GET /api/projects`

**Widgets Displayed:**

#### 3.2.1 Current Phase Widget

**Logic:**
```typescript
const currentPhase = project.phases.find(p => p.status === 'IN_PROGRESS') 
  || project.phases.filter(p => p.status === 'DONE').pop()
  || null
```

**Display:**
- If phase found: "You are currently in: [phase.title]"
- If no phase: "You are currently in: Onboarding"

**Data Dependency:** `project.phases[]` array

#### 3.2.2 Next From Us Widget

**Display:**
- Label: "Next from us"
- Content: `project.next_from_us` or "No updates yet."
- Updated by: PM/Admin

**Data Dependency:** `project.next_from_us` (string | null)

#### 3.2.3 Next From You Widget

**Display:**
- Label: "Next from you"
- Content: `project.next_from_you` or "Nothing for now."
- Updated by: PM/Admin

**Data Dependency:** `project.next_from_you` (string | null)

#### 3.2.4 Onboarding Progress Widget

**Display:**
- Label: "Onboarding"
- Content: `Onboarding: ${project.onboarding_percent}% complete`
- Visual: Progress bar (optional)

**Data Dependency:** `project.onboarding_percent` (0-100)

#### 3.2.5 Day Counter Widget

**Display:**
- Label: "Today"
- Content: `Today: Day ${project.current_day_of_14} of 14`
- Condition: Only shown if `project.current_day_of_14` is not null

**Data Dependency:** `project.current_day_of_14` (1-14 | null)

#### 3.2.6 Kit Type Widget

**Display:**
- Shows which kit the user has: "Launch Kit" or "Growth Kit"

**Data Dependency:** `project.kit_type` ('LAUNCH' | 'GROWTH')

### 3.3 Navigation from Home

**Available Actions:**

1. **Navigate to Kit-Specific Page**
   - Launch Kit → Click "Launch Kit" in navigation → `/launch-kit`
   - Growth Kit → Click "Growth Kit" in navigation → `/growth-kit`

2. **View Build Tracker**
   - From kit-specific page → Click "View Build Tracker" → `/launch-kit/build-tracker` or `/growth-kit/build-tracker`

3. **Continue Onboarding**
   - From kit-specific page → Click on active step → Navigate to step form

---

## 4. Launch Kit Flow

### 4.1 Main Launch Kit Page (`/launch-kit`)

**Route:** `src/app/launch-kit/page.tsx`

**Component:** `src/components/launch-kit/LaunchKitContent.tsx`

**Entry Conditions:**
- User authenticated
- User has project with `kit_type === 'LAUNCH'`

**UI Structure:**

#### 4.1.1 Hero Text

```
"Launch Kit: Klaro will walk you through these steps so we can build your 3 page site in 14 days."
```

#### 4.1.2 Onboarding Wizard Overview (Top Block)

**Step Strip (Horizontal Layout):**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Step 1     │  │   Step 2     │  │   Step 3     │
│ Tell us who  │  │ Show us your │  │ Switch on   │
│   you are    │  │    brand     │  │   the site   │
│              │  │              │  │              │
│ [Status]     │  │ [Status]     │  │ [Status]     │
│ About 5 min  │  │ About 8 min  │  │ About 5 min  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Step Status Logic:**
- **Step 1:** Always clickable (status: NOT_STARTED, IN_PROGRESS, or DONE)
- **Step 2:** Clickable only if Step 1 status === 'DONE'
- **Step 3:** Clickable only if Step 2 status === 'DONE'

**Visual States:**
- **Locked:** Grayed out, disabled cursor, cannot click
- **Active:** Highlighted, clickable, current step
- **Complete:** Checkmark icon, clickable to review/edit

**Progress Indicator:**
- Below step strip: `Step [n] of 3 · Onboarding [onboarding_percent]% complete`

**Navigation:**
- Click on step → Navigate to `/launch-kit/onboarding/step-[n]`

#### 4.1.3 Build Tracker Link

**Button:** "View Build Tracker"
- Links to: `/launch-kit/build-tracker`
- Always visible (even during onboarding)

---

### 4.2 Launch Kit Step 1: Tell us who you are

**Route:** `src/app/launch-kit/onboarding/step-1/page.tsx`

**Component:** `src/components/launch-kit/onboarding/Step1Form.tsx`

**Header:**
- Left: "Launch Kit – Step 1 of 3"
- Subtitle: "Tell us who you are and what you sell. This gives us the basics to start."
- Right Badge: "About 5 minutes" | "Required fields [completed] / 7 complete"

**Layout:** Two-column (Form left, Guidance right)

**Left Column – Form Fields:**

**Card: About you and your business**

1. **Business name** (short text) - Required
   - Label: "Business name"
   - Help text: "Exactly how you want it on the site."

2. **Your name and role** (short text) - Required
   - Label: "Your name and role"
   - Help text: "For example: Goodness Olawale, Founder."

3. **Contact email** (email field) - Required
   - Label: "Best contact email"
   - Help text: "We use this for project updates and contact form enquiries."

4. **Phone or WhatsApp** (short text) - Required
   - Label: "Phone or WhatsApp"
   - Help text: "Only used for project communication. We will not show it on the site unless you say yes."

5. **Social links** (repeating pair) - At least one required
   - Label: "Main social profiles"
   - Subfields: Platform (dropdown) + URL
   - Help text: "Instagram, LinkedIn or any place you want people to find you."
   - Can add multiple social links

**Card: Your main offer**

6. **What do you sell** (long text) - Required
   - Label: "What do you sell in one or two sentences"

7. **Who is this for** (long text) - Required
   - Label: "Who is this for"

**Right Column – Guidance:**

**Card 1: Why this step matters**
> "These answers help Klaro talk about you in simple language. Once this step is done, we can already start preparing for your brand call."

**Card 2: Required to continue**
- Lists all 7 required fields
- Counter: "Required fields complete: X of 7"
- Updates in real-time as user fills fields

**Card 3: Next from us**
> "Once Step 1 is complete, we will review your answers and send a link to book your brand call."

**Progress Bar:**
- Thin bar showing Step 1 progress only
- Label: "Step 1 – Tell us who you are"
- Fills based on: `required_fields_completed / required_fields_total`

**Buttons:**
- Left: "Save and come back later" (gray link button)
  - Action: Save form data, stay on page
- Right: "Save and continue to Step 2" (primary button)
  - Action: Save form data, validate required fields
  - If validation fails: Show error "Please complete the required fields marked with *."
  - If validation passes: Update step status to DONE, redirect to `/launch-kit/onboarding/step-2`

**Completion Logic:**
- When `required_fields_completed === required_fields_total`:
  - Step 1 status → `DONE`
  - Overall onboarding_percent → ~35% (7 of 18 total required fields)
  - Step 2 becomes clickable in main Launch Kit page

**Data Persistence:**
- Form data saved to `localStorage` (mock) or `onboarding_steps.fields` (backend)
- Progress tracked via `required_fields_completed` counter

---

### 4.3 Launch Kit Step 2: Show us your brand

**Route:** `src/app/launch-kit/onboarding/step-2/page.tsx`

**Component:** `src/components/launch-kit/onboarding/Step2Form.tsx`

**Entry Condition:** Step 1 status must be `DONE`

**Header:**
- Title: "Step 2 of 3 – Show us your brand"
- Subtitle: "Logo, colours, photos and who you serve."
- Badge: "About 8 minutes" | "Required fields [completed] / 7 complete"

**Layout:** Same two-column layout as Step 1

**Left Column – Form Fields:**

**Card A: Brand visuals**

1. **Logo upload** (file upload) - Required
2. **Brand colours** (color picker/hex input) - Required
   - Can add multiple colors
3. **Brand photos** (file upload multiple) - Required
   - Can upload multiple photos
4. **Inspiration sites** (URLs, repeating) - Optional
   - Can add multiple URLs

**Card B: Clients and proof**

5. **Ideal client description** (long text) - Required
6. **Top 3 problems** (3 short text fields) - Required
   - Field 1, Field 2, Field 3
7. **Top 3 results** (3 short text fields) - Required
   - Field 1, Field 2, Field 3
8. **Testimonials** (3-10, file upload or text) - Required
   - Can add multiple testimonials
9. **Review links** (URLs, repeating) - Optional
   - Can add multiple URLs

**Card C: Voice and vibe**

10. **3 voice words** (multi-select or 3 separate fields) - Required
11. **Words or phrases to avoid** (long text) - Optional

**Right Column:**
- Why this step matters
- Required to continue (list + counter: "Required fields complete: X of 7")
- Next from us: "Once this step is done, we can lock your message and start writing your copy."

**Buttons:**
- Left: "Back to Step 1" (link button)
  - Action: Navigate to `/launch-kit/onboarding/step-1`
- Right: "Save and continue to Step 3" (primary button)
  - Action: Save, validate, update status, redirect to Step 3

**Completion Banner (if Steps 1 & 2 complete):**
> ✅ "You have given us enough to start building your site. We can begin once you complete Step 3 or on our next call."

**Completion Logic:**
- When all required fields complete:
  - Step 2 status → `DONE`
  - Overall onboarding_percent → ~70% (14 of 18 total required fields)
  - Step 3 becomes clickable

---

### 4.4 Launch Kit Step 3: Switch on the site

**Route:** `src/app/launch-kit/onboarding/step-3/page.tsx`

**Component:** `src/components/launch-kit/onboarding/Step3Form.tsx`

**Entry Condition:** Step 2 status must be `DONE`

**Header:**
- Title: "Step 3 of 3 – Switch on the site"
- Subtitle: "Domain, forms and anything we need to launch."
- Badge: "About 5 minutes" | "Required fields [completed] / 4 complete"

**Left Column – Form Fields:**

**Card: Tech and launch**

1. **Domain provider** (dropdown) - Required
   - Options: Common providers (e.g., GoDaddy, Namecheap, etc.)
2. **Existing site platform** (text) - Optional
3. **How you will share access** (long text) - Required
   - Instructions for sharing domain/DNS access
4. **Email for contact form** (email) - Required
5. **Privacy/terms link** (URL) - Optional

**Right Column:**
- Why this step matters: "This is what lets us connect your domain and test forms before launch."
- Required to finish (list + counter)
- Next from us: "Once this step is done, we prepare your site for launch."

**Buttons:**
- Left: "Back to Step 2" (link button)
  - Action: Navigate to `/launch-kit/onboarding/step-2`
- Right: "Finish onboarding" (primary button)
  - Action: Save, validate, update status to DONE, show success state

**Success State (after completion):**
```
Onboarding complete
You have finished all three steps.
Klaro now has everything it needs to start your Launch Kit project.
You will see live updates in your dashboard as we move through copy, design and launch.
```

**Completion Logic:**
- When all required fields complete:
  - Step 3 status → `DONE`
  - Overall onboarding_percent → 100% (18 of 18 total required fields)
  - All onboarding steps complete
  - User can now view build tracker to see project phases

---

### 4.5 Launch Kit Build Tracker

**Route:** `src/app/launch-kit/build-tracker/page.tsx`

**Component:** `src/components/launch-kit/BuildTracker.tsx`

**Title:** "Launch Kit – Build progress (14 days)"

**Phase Strip (Horizontal):**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Phase 1     │  │  Phase 2     │  │  Phase 3     │  │  Phase 4     │
│ Inputs &     │  │ Words that   │  │ Design &     │  │ Test &       │
│ clarity      │  │   sell       │  │   build      │  │   launch     │
│              │  │              │  │              │  │              │
│ Days 0-2     │  │ Days 3-5     │  │ Days 6-10    │  │ Days 11-14   │
│ [Status]     │  │ [Status]     │  │ [Status]     │  │ [Status]     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Phase Expansion Logic:**
- Expand the first phase with status `IN_PROGRESS` or `WAITING_ON_CLIENT`
- If none, expand the last phase with status `DONE`
- If all phases are `NOT_STARTED`, expand Phase 1

**Expanded Phase Card Content:**

**Phase 1: Inputs & clarity (Days 0-2)**
- Subtitle: "Lock the message and plan."
- Checklist:
  - ☐ Onboarding steps completed
  - ☐ Brand / strategy call completed
  - ☐ Simple 14 day plan agreed
- Next from us: "We are taking your inputs and call notes and shaping the outline for your 3 pages."
- Next from you: "Nothing for now. We will come back to you with copy to review."

**Phase 2: Words that sell (Days 3-5)**
- Subtitle: "We write your 3 pages."
- Checklist:
  - ☐ Draft homepage copy ready
  - ☐ Draft offer / services page ready
  - ☐ Draft contact / about copy ready
  - ☐ You reviewed and approved copy
- Links: "View copy doc" (if available)
- Next from us: "We are drafting your homepage and offer page copy."
- Next from you: "Please review your copy and leave one round of comments."

**Phase 3: Design & build (Days 6-10)**
- Subtitle: "We turn copy into a 3 page site."
- Checklist:
  - ☐ Site layout built for all 3 pages
  - ☐ Mobile checks done
  - ☐ Testimonials and proof added
  - ☐ Staging link shared with you
- Links: "View staging site" (if available)
- Next from us: "We are building your 3 page site using your approved copy."
- Next from you: "Please click through the staging site and flag any small tweaks."

**Phase 4: Test & launch (Days 11-14)**
- Subtitle: "We connect domain, test and go live."
- Checklist:
  - ☐ Forms tested
  - ☐ Domain connected
  - ☐ Final tweaks applied
  - ☐ Loom walkthrough recorded and shared
- Links: "View live site", "Watch Loom walkthrough" (if available)
- Next from us: "We are testing your contact form and connecting your domain."
- Next from you: "Please confirm everything looks good and share any final non-urgent tweaks."

**Data Source:** `project.phases[]` array with `kit_type === 'LAUNCH'`

**Status Pills:**
- `NOT_STARTED` → Gray pill
- `IN_PROGRESS` → Blue pill
- `WAITING_ON_CLIENT` → Yellow pill
- `DONE` → Green pill with checkmark

**Checklist Items:**
- Displayed as list with checkboxes
- Checked items show checkmark (read-only for clients)
- Updated by PM/Admin

**Phase Links:**
- Displayed as clickable buttons/links
- Open in new tab
- Only shown if links exist for that phase

---

## 5. Growth Kit Flow

### 5.1 Main Growth Kit Page (`/growth-kit`)

**Route:** `src/app/growth-kit/page.tsx`

**Component:** `src/components/growth-kit/GrowthKitContent.tsx`

**Entry Conditions:**
- User authenticated
- User has project with `kit_type === 'GROWTH'`

**UI Structure:**

#### 5.1.1 Hero Text

```
"Growth Kit: Klaro will help you set up the pieces we need to build your funnel and emails in 14 days."
```

#### 5.1.2 Onboarding Wizard Overview (Top Block)

**Step Strip (Horizontal Layout):**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Step 1     │  │   Step 2     │  │   Step 3     │
│ Snapshot and│  │ Clients,     │  │ Systems and  │
│ main offer  │  │ proof and     │  │   launch     │
│              │  │ content fuel  │  │              │
│              │  │              │  │              │
│ [Status]     │  │ [Status]     │  │ [Status]     │
│ About 8 min  │  │ About 10 min │  │ About 7 min  │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Step Status Logic:** Same as Launch Kit (Step 2 locked until Step 1 DONE, etc.)

**Progress Indicator:**
- Below step strip: `Step [n] of 3 · Onboarding [onboarding_percent]% complete`

**Navigation:**
- Click on step → Navigate to `/growth-kit/onboarding/step-[n]`

#### 5.1.3 Build Tracker Link

**Button:** "View Build Tracker"
- Links to: `/growth-kit/build-tracker`

---

### 5.2 Growth Kit Step 1: Snapshot and main offer

**Route:** `src/app/growth-kit/onboarding/step-1/page.tsx`

**Component:** `src/components/growth-kit/onboarding/Step1Form.tsx`

**Header:**
- Title: "Growth Kit – Step 1 of 3"
- Subtitle: "Snapshot of your business and the main offer this funnel is built around."
- Badge: "About 8 minutes" | "Required fields [completed] / 12 complete"

**Layout:** Two-column (Form left, Guidance right)

**Left Column – Form Fields:**

**Card A: Business snapshot**

1. **Business name** (short text) - Required
2. **Your name and role** (short text) - Required
3. **Monthly revenue band** (dropdown) - Required
   - Options: Under £10K, £10K to £20K, £20K to £35K, £35K to £50K, Over £50K
4. **Where you operate** (long text) - Required
5. **Current website URL** (URL) - Optional
6. **Main channels** (multi-select) - Required
   - Options: Instagram, LinkedIn, TikTok, YouTube, Email list, Paid ads, Other

**Card B: The offer we are backing**

7. **Offer name** (short text) - Required
8. **Who this offer is for** (long text) - Required
9. **What is included** (long text/bullet list) - Required
10. **How you deliver it** (multi-select) - Required
    - Options: 1:1, Group, Done for you, Hybrid, Self paced, Other
11. **Typical timeline** (short text) - Required
12. **Pricing and payment options** (long text) - Required
13. **How to show pricing** (dropdown) - Required
    - Options: Full prices, From £X, No prices shown

**Right Column:**
- Why this step matters
- Required to continue (list + counter: "Required fields complete: X of 12")
- Next from us: "Once Step 1 is complete, we will review your answers and start shaping your funnel plan."

**Buttons:**
- Left: "Save and come back later"
- Right: "Save and continue to Step 2"

**Completion Logic:**
- When all required fields complete:
  - Step 1 status → `DONE`
  - Overall onboarding_percent → ~35% (12 of 31 total required fields)
  - Step 2 becomes clickable

---

### 5.3 Growth Kit Step 2: Clients, proof and content fuel

**Route:** `src/app/growth-kit/onboarding/step-2/page.tsx`

**Component:** `src/components/growth-kit/onboarding/Step2Form.tsx`

**Entry Condition:** Step 1 status must be `DONE`

**Header:**
- Title: "Growth Kit – Step 2 of 3"
- Subtitle: "Clients, proof and content that feeds your funnel."
- Badge: "About 10 minutes" | "Required fields [completed] / 9 complete"

**Left Column – Form Fields:**

**Card A: Your people**

1. **Ideal client description** (long text) - Required
2. **Top 5 pains** (5 short fields or long text) - Required
3. **Top 5 outcomes** (5 short fields or long text) - Required
4. **Common objections** (long text or multiple fields) - Required
5. **Reasons people choose you** (long text) - Optional
6. **Competitors or alternatives** (long text) - Optional

**Card B: Voice and proof**

7. **3 words for your voice** (multi-select or 3 fields) - Required
8. **Words or phrases to avoid** (long text) - Optional
9. **Testimonials** (5-15, file upload or text) - Required
10. **Case study outlines** (3-5, repeating group) - Required
    - Subfields: Client type, Problem, What you did, Result
11. **Review links** (repeating URL) - Optional
12. **Logos, awards, features** (file upload + text) - Optional

**Card C: Content fuel**

13. **Top 10 buyer questions** (long text or repeating fields) - Required
14. **3 common mistakes or myths** (long text or 3 fields) - Required
15. **Topics to be known for** (long text) - Optional
16. **Existing lead magnet** (file or URL) - Optional
17. **Keep or replace lead magnet** (dropdown) - Optional
    - Options: Keep and improve it, Replace it, Not sure

**Right Column:**
- Why this step matters: "This is where your funnel gets its edge..."
- Required to continue (list + counter: "Required fields complete: X of 9")
- Next from us: "Once Step 2 is complete, we will lock in your message and start drafting your site copy and email sequence."

**Buttons:**
- Left: "Back to Step 1"
- Right: "Save and continue to Step 3"

**Completion Banner:**
> ✅ "You have given us enough to start building your funnel. We can begin once you complete Step 3 or on our next call."

**Completion Logic:**
- When all required fields complete:
  - Step 2 status → `DONE`
  - Overall onboarding_percent → ~68% (21 of 31 total required fields)
  - Step 3 becomes clickable

---

### 5.4 Growth Kit Step 3: Systems and launch

**Route:** `src/app/growth-kit/onboarding/step-3/page.tsx`

**Component:** `src/components/growth-kit/onboarding/Step3Form.tsx`

**Entry Condition:** Step 2 status must be `DONE`

**Header:**
- Title: "Growth Kit – Step 3 of 3"
- Subtitle: "Website, email, tracking and how we will work together."
- Badge: "About 7 minutes" | "Required fields [completed] / 10 complete"

**Left Column – Form Fields:**

**Card A: Website and domain**

1. **What your current site is built on** (dropdown) - Required
2. **How we get access to your site** (long text) - Required
3. **Where your domain is registered** (dropdown) - Required
4. **How we get DNS access or tech contact** (long text) - Required

**Card B: Email, booking and CRM**

5. **Email platform** (dropdown) - Required
6. **How we get email platform access** (long text) - Required
7. **Booking link or system** (URL) - Required
8. **Do you use a CRM** (dropdown) - Optional
   - Options: None, HubSpot, Pipedrive, Close, Other
   - If not None: Show additional fields for details and access

**Card C: Tracking and policies**

9. **What tracking and ads you use** (multi-select) - Required
   - Options: Google Analytics, Google Tag Manager, Meta Ads, LinkedIn Ads, Google Ads, Other
10. **Privacy policy link** (URL) - Required
11. **Terms and conditions link** (URL) - Optional
12. **Any required disclaimers** (long text) - Optional

**Card D: How we work together**

13. **Who makes final decisions** (short text) - Required
14. **Secondary contact** (short text) - Optional
15. **Preferred communication channel** (dropdown) - Required
    - Options: Email, WhatsApp, Slack, Other
16. **How quickly you can review** (dropdown) - Required
    - Options: Within 24 hours, Within 48 hours, Within 3 days
17. **Dates offline in next 14 days** (long text or date range) - Optional
18. **Main traffic focus after launch** (multi-select) - Required
    - Options: Instagram, LinkedIn, Email list, Paid ads, SEO, Other

**Right Column:**
- Why this step matters: "This is the part that connects everything..."
- Required to finish (list + counter)
- Next from us: "Once Step 3 is complete, we can start building and wiring your funnel."

**Buttons:**
- Left: "Back to Step 2"
- Right: "Finish onboarding" (primary button)

**Success State:**
```
Growth Kit onboarding complete
You have finished all three steps. Klaro now has what it needs to build your funnel.
Look at your Home screen to see what we are working on next.
```

**Completion Logic:**
- When all required fields complete:
  - Step 3 status → `DONE`
  - Overall onboarding_percent → 100% (31 of 31 total required fields)
  - All onboarding steps complete

---

### 5.5 Growth Kit Build Tracker

**Route:** `src/app/growth-kit/build-tracker/page.tsx`

**Component:** `src/components/growth-kit/BuildTracker.tsx`

**Title:** "Growth Kit – Build progress (14 days)"

**Phase Strip (Horizontal):**

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Phase 1     │  │  Phase 2     │  │  Phase 3     │  │  Phase 4     │
│ Strategy     │  │ Copy & email │  │ Build the    │  │ Test, launch │
│ locked in    │  │   engine     │  │   funnel     │  │ & handover   │
│              │  │              │  │              │  │              │
│ Days 0-2     │  │ Days 3-5     │  │ Days 6-10    │  │ Days 11-14   │
│ [Status]     │  │ [Status]     │  │ [Status]     │  │ [Status]     │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Phase Expansion Logic:** Same as Launch Kit

**Expanded Phase Card Content:**

**Phase 1: Strategy locked in (Days 0-2)**
- Subtitle: "Offer, goal and funnel map agreed."
- Checklist:
  - ☐ Onboarding complete
  - ☐ Strategy / funnel call done
  - ☐ Main offer + 90 day goal confirmed
  - ☐ Simple funnel map agreed
- Next from us: "We are using your inputs and call notes to outline your site structure and email plan."
- Next from you: "Nothing for now. If your offer or pricing changes, tell us here."

**Phase 2: Copy & email engine (Days 3-5)**
- Subtitle: "We write your site copy and 5 emails."
- Checklist:
  - ☐ Draft website copy ready
  - ☐ Draft 5-email nurture sequence ready
  - ☐ You reviewed and approved copy
  - ☐ Any changes locked in
- Links: "View website copy", "View email sequence" (if available)
- Next from us: "We are drafting your core site copy and 5 nurture emails."
- Next from you: "Please review the copy and leave one set of comments."

**Phase 3: Build the funnel (Days 6-10)**
- Subtitle: "Pages, lead magnet and blog hub built."
- Checklist:
  - ☐ 4-6 page site built on staging
  - ☐ Lead magnet page + thank you page built
  - ☐ Opt-in forms wired to email platform
  - ☐ Blog hub and 1-2 starter posts set up
  - ☐ Staging link shared
- Links: "View staging funnel" (if available)
- Next from us: "We are building your site, lead magnet flow and wiring forms to your email platform."
- Next from you: "Please test the pages and lead magnet journey and flag anything that feels off."

**Phase 4: Test, launch & handover (Days 11-14)**
- Subtitle: "We test the full journey and go live."
- Checklist:
  - ☐ Funnel tested from first visit to booked call
  - ☐ Domain connected
  - ☐ Tracking checked (Analytics / pixels)
  - ☐ 5-email sequence switched on
  - ☐ Loom walkthrough recorded and shared
- Links: "View live funnel", "Watch Loom walkthrough" (if available)
- Next from us: "We are testing your funnel, connecting the domain and switching on your emails."
- Next from you: "Please confirm you are happy with the live version and share any early feedback."

**Data Source:** `project.phases[]` array with `kit_type === 'GROWTH'`

**UI Behavior:** Same as Launch Kit build tracker

---

## 6. Support Page Flow

### 6.1 Support Page

**Route:** `src/app/support/page.tsx`

**Entry Conditions:**
- User authenticated

**Purpose:** Communication hub for support interactions

**Content Structure:**
- Messages from Klarnow team
- Loom video links
- Project updates
- Support tickets/requests

**Navigation:**
- Accessible from top navigation bar
- Always visible (not dependent on kit type)

**Current Status:** Placeholder page (to be implemented)

---

## 7. Navigation & Global Components

### 7.1 Top Navigation Bar

**Component:** `src/components/layout/Navigation.tsx`

**Location:** Included in root layout (`src/app/layout.tsx`)

**Navigation Links:**

1. **Home**
   - Route: `/home`
   - Always visible when authenticated
   - Subtitle: "Your project with Klarnow in one place."

2. **Launch Kit**
   - Route: `/launch-kit`
   - Visibility: Only shown if `project.kit_type === 'LAUNCH'`
   - Subtitle: "3 page high trust site in 14 days."

3. **Growth Kit**
   - Route: `/growth-kit`
   - Visibility: Only shown if `project.kit_type === 'GROWTH'`
   - Subtitle: "4 to 6 page funnel and emails in 14 days."

4. **Support**
   - Route: `/support`
   - Always visible when authenticated
   - Subtitle: "Messages, Looms and updates from the Klarnow team."

5. **Sign Out**
   - Action: Logout user, clear session
   - Redirects to `/` (login page)

**Conditional Rendering Logic:**

```typescript
// Pseudo-code
if (isAuthenticated) {
  showNavigation = true
  showHome = true
  showLaunchKit = (project?.kit_type === 'LAUNCH')
  showGrowthKit = (project?.kit_type === 'GROWTH')
  showSupport = true
  showSignOut = true
} else {
  showNavigation = false
}
```

**Visual States:**
- Active link: Highlighted/underlined
- Inactive links: Normal styling
- Kit-specific links: Only show relevant kit based on `project.kit_type`

### 7.2 Root Layout

**Component:** `src/app/layout.tsx`

**Includes:**
- Font imports (Geist, Geist Mono)
- Navigation component
- Global styles
- Metadata

**Structure:**
```tsx
<Layout>
  <Navigation />
  <main>{children}</main>
</Layout>
```

---

## 8. State Transitions & Status Flow

### 8.1 Onboarding Step Status Transitions

**Status Values:**
- `NOT_STARTED` → Initial state
- `IN_PROGRESS` → User has started filling form
- `DONE` → All required fields completed

**Transition Flow:**

```
NOT_STARTED
    │
    │ (User opens step form)
    ▼
IN_PROGRESS
    │
    │ (User fills required fields)
    │ (required_fields_completed === required_fields_total)
    ▼
DONE
```

**Status Update Triggers:**
- `NOT_STARTED` → `IN_PROGRESS`: When user first saves form data
- `IN_PROGRESS` → `DONE`: When `required_fields_completed === required_fields_total`
- Status persists in `onboarding_steps.status` field

**Step Locking Logic:**
- Step 1: Always accessible
- Step 2: Accessible only if Step 1 status === `DONE`
- Step 3: Accessible only if Step 2 status === `DONE`

**Visual Representation:**
- `NOT_STARTED`: Gray, disabled (if locked)
- `IN_PROGRESS`: Blue, active
- `DONE`: Green with checkmark

---

### 8.2 Phase Status Transitions

**Status Values:**
- `NOT_STARTED` → Initial state
- `IN_PROGRESS` → PM has started working on phase
- `WAITING_ON_CLIENT` → PM waiting for client action/feedback
- `DONE` → Phase completed

**Transition Flow:**

```
NOT_STARTED
    │
    │ (PM starts phase)
    ▼
IN_PROGRESS
    │
    │ (PM needs client input)
    ▼
WAITING_ON_CLIENT
    │
    │ (Client provides input, PM continues)
    │
    ├───> IN_PROGRESS (if PM continues)
    │
    └───> DONE (if phase complete)
```

**Status Update Triggers:**
- Updated by PM/Admin via admin API
- Clients can view but not modify phase status

**Phase Expansion Logic:**
- Expand first phase with `IN_PROGRESS` or `WAITING_ON_CLIENT`
- If none, expand last phase with `DONE`
- If all `NOT_STARTED`, expand Phase 1

---

### 8.3 Progress Calculation Logic

**Onboarding Progress:**

```typescript
onboarding_percent = ROUND(
  (SUM(required_fields_completed) / SUM(required_fields_total)) * 100
)
```

**Example:**
- Launch Kit: 18 total required fields
  - Step 1 complete (7/7) → ~39%
  - Step 2 complete (14/18) → ~78%
  - Step 3 complete (18/18) → 100%

- Growth Kit: 31 total required fields
  - Step 1 complete (12/12) → ~39%
  - Step 2 complete (21/31) → ~68%
  - Step 3 complete (31/31) → 100%

**Update Triggers:**
- Automatically calculated when `onboarding_steps.required_fields_completed` changes
- Stored in `projects.onboarding_percent`
- Updated via database trigger (backend) or client-side calculation (mock)

---

### 8.4 Real-Time Update Handling

**Supabase Realtime Subscriptions:**

```typescript
// Subscribe to project updates
const channel = supabase
  .channel('project-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'projects',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Update UI with new project data
      updateProjectData(payload.new)
    }
  )
  .subscribe()
```

**Tables with Realtime Enabled:**
- `projects`
- `onboarding_steps`
- `phases`
- `checklist_items`

**UI Update Behavior:**
- When PM updates phase status → UI updates automatically
- When PM updates checklist → UI updates automatically
- When PM updates `next_from_us` or `next_from_you` → Home page widgets update

**Fallback (Mock Mode):**
- Uses `localStorage` for data persistence
- No real-time updates (polling or manual refresh required)

---

## 9. Error States & Edge Cases

### 9.1 Unauthenticated Access Attempts

**Scenario:** User tries to access protected route without authentication

**Routes Affected:**
- `/home`
- `/launch-kit/*`
- `/growth-kit/*`
- `/support`

**Handling:**
1. Check authentication status on page load
2. If not authenticated → Redirect to `/` (login page)
3. Show message: "Please log in to continue"

**Implementation:**
```typescript
// In page component
if (!isAuthenticated) {
  redirect('/')
}
```

---

### 9.2 Missing Project Scenarios

**Scenario:** User is authenticated but has no project

**Location:** `/home` page

**Handling:**
1. Check if project exists
2. If no project → Show `InitializeProjectPrompt` component
3. User selects kit type and initializes project
4. After initialization → Redirect to appropriate onboarding flow

**Component:** `src/components/home/InitializeProjectPrompt.tsx`

---

### 9.3 Step Locking Violations

**Scenario:** User tries to access locked step (e.g., Step 2 when Step 1 is not DONE)

**Routes Affected:**
- `/launch-kit/onboarding/step-2`
- `/launch-kit/onboarding/step-3`
- `/growth-kit/onboarding/step-2`
- `/growth-kit/onboarding/step-3`

**Handling:**
1. Check previous step status on page load
2. If previous step is not `DONE`:
   - Show error message: "Please complete [Previous Step] first"
   - Redirect to previous step or main kit page
   - Disable form submission

**Implementation:**
```typescript
// In step page component
if (previousStep.status !== 'DONE') {
  return <StepLockedMessage previousStep={previousStep} />
}
```

---

### 9.4 Form Validation Errors

**Scenario:** User tries to submit form with missing required fields

**Handling:**
1. Validate required fields on form submission
2. If validation fails:
   - Show error message: "Please complete the required fields marked with *."
   - Highlight missing fields
   - Scroll to first missing field
   - Prevent form submission
3. If validation passes:
   - Save form data
   - Update step status
   - Redirect to next step (if "Save and continue")

**Error Display:**
- Inline error messages below fields
- Summary error message at top of form
- Required fields marked with asterisk (*)

---

### 9.5 Network/API Errors

**Scenario:** API call fails (network error, server error)

**Handling:**
1. Show error message to user
2. Retry mechanism (optional)
3. Save form data to localStorage as backup (mock mode)
4. Allow user to retry submission

**Error Messages:**
- "Something went wrong. Please try again."
- "Unable to save. Your data is saved locally. Please try again later."

---

### 9.6 Session Expiration

**Scenario:** User session expires while using dashboard

**Handling:**
1. Detect expired session on API call
2. Show message: "Your session has expired. Please log in again."
3. Redirect to `/` (login page)
4. Clear local data (if applicable)

---

### 9.7 Invalid Kit Type Access

**Scenario:** User with Launch Kit tries to access Growth Kit routes (or vice versa)

**Handling:**
1. Check `project.kit_type` on page load
2. If kit type doesn't match route:
   - Redirect to correct kit page
   - Show message: "You are on [Kit Type]. Redirecting to your kit page."

**Routes:**
- Launch Kit user accessing `/growth-kit/*` → Redirect to `/launch-kit`
- Growth Kit user accessing `/launch-kit/*` → Redirect to `/growth-kit`

---

## 10. User Interaction Patterns

### 10.1 Form Submission Flows

#### 10.1.1 "Save and come back later"

**Action:**
1. Save form data to backend/localStorage
2. Update `required_fields_completed` count
3. Update step status to `IN_PROGRESS` (if fields filled)
4. Stay on current page
5. Show success message: "Progress saved"

**Use Case:** User wants to complete form later

---

#### 10.1.2 "Save and continue to Step [N]"

**Action:**
1. Validate all required fields
2. If validation fails → Show error, prevent navigation
3. If validation passes:
   - Save form data
   - Update `required_fields_completed` to match `required_fields_total`
   - Update step status to `DONE`
   - Update `onboarding_percent`
   - Redirect to next step page

**Use Case:** User completes step and wants to continue

---

#### 10.1.3 "Finish onboarding"

**Action:**
1. Validate all required fields
2. If validation fails → Show error
3. If validation passes:
   - Save form data
   - Update step status to `DONE`
   - Update `onboarding_percent` to 100%
   - Show success state with completion message
   - Optionally redirect to home page or build tracker

**Use Case:** User completes final onboarding step

---

### 10.2 Progress Tracking Updates

**Real-Time Progress Calculation:**

```typescript
// On each field change
const updateProgress = () => {
  const completed = countCompletedRequiredFields()
  const total = getTotalRequiredFields()
  const percent = Math.round((completed / total) * 100)
  
  updateStepProgress(stepId, {
    required_fields_completed: completed,
    status: completed === total ? 'DONE' : 'IN_PROGRESS'
  })
  
  updateOnboardingPercent(projectId, percent)
}
```

**Visual Feedback:**
- Progress bar fills as fields are completed
- Counter updates: "Required fields X / Y complete"
- Step status pill updates color
- Overall onboarding percent updates

---

### 10.3 Checklist Item Interactions

**Note:** Checklist items are read-only for clients (updated by PM/Admin)

**Client View:**
- See checklist items with checkmarks
- Cannot toggle items
- Visual indication of completion status

**PM/Admin View (Future):**
- Can toggle checklist items
- Updates reflected in real-time to client
- Updates phase status based on completion

---

### 10.4 Phase Expansion/Collapse

**Interaction:**
- Click on phase in phase strip → Expand/collapse phase card
- Only one phase expanded at a time
- Current active phase (IN_PROGRESS or WAITING_ON_CLIENT) auto-expanded on page load

**Visual Feedback:**
- Expanded phase: Shows full content (checklist, links, next from us/you)
- Collapsed phase: Shows only title, status, day range

---

### 10.5 Navigation Patterns

#### 10.5.1 Breadcrumb Navigation

**Onboarding Steps:**
- Show breadcrumb: Home > Launch Kit > Step 1 of 3
- Clickable links to previous steps (if unlocked)
- Current step highlighted

#### 10.5.2 Back Button

**On Step Forms:**
- "Back to Step [N]" button on Steps 2 and 3
- Navigates to previous step
- Preserves form data

#### 10.5.3 Top Navigation

**Between Main Sections:**
- Home, Launch Kit/Growth Kit, Support
- Always accessible
- Active link highlighted

---

### 10.6 File Upload Interactions

**Fields with File Upload:**
- Logo upload (Step 2)
- Brand photos (Step 2)
- Testimonials (Step 2)
- Case studies (Growth Kit Step 2)

**Interaction Flow:**
1. User clicks "Upload" or drags file
2. File selected → Show preview (if image)
3. Upload progress indicator
4. File uploaded → Show success, display preview
5. Option to remove/replace file

**Validation:**
- File type validation
- File size limits
- Multiple files allowed (where applicable)

---

### 10.7 Multi-Select Interactions

**Fields with Multi-Select:**
- Social links (Step 1)
- Main channels (Growth Kit Step 1)
- How you deliver it (Growth Kit Step 1)
- Tracking and ads (Growth Kit Step 3)
- Main traffic focus (Growth Kit Step 3)

**Interaction:**
1. Click dropdown/checkbox list
2. Select multiple options
3. Selected options displayed as chips/tags
4. Option to remove selections

---

### 10.8 Repeating Field Groups

**Fields with Repeating Groups:**
- Social links (Step 1)
- Top 3 problems (Step 2)
- Top 3 results (Step 2)
- Case study outlines (Growth Kit Step 2)

**Interaction:**
1. User fills first field
2. Clicks "Add another" button
3. New field group appears
4. Can add multiple groups
5. Can remove groups (minimum 1 required)

---

## Summary

This UI flow documentation provides a comprehensive guide to:

1. **User Journeys:** From login through all dashboard pages
2. **Navigation Patterns:** How users move between pages and sections
3. **State Management:** How status and progress are tracked and updated
4. **Conditional Rendering:** What content shows based on user state and project data
5. **Error Handling:** How edge cases and errors are managed
6. **User Interactions:** How users interact with forms, buttons, and UI elements

**Key Takeaways:**
- Authentication is required for all dashboard pages
- Kit type determines which onboarding flow is shown
- Step locking ensures users complete steps in order
- Progress is tracked in real-time as users fill forms
- Build tracker shows project phases with checklists and links
- All interactions are designed to guide users through the 14-day project timeline

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Status: UI Flow Specification*

