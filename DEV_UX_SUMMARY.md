# Klarnow Client Dashboard - Dev UX Summary

## Overview

This document provides comprehensive technical specifications for building the Klarnow Client Dashboard. The dashboard is a guided onboarding and project tracking system that helps clients submit information for their Launch Kit (3-page site) or Growth Kit (4-6 page funnel with emails) over 14 days.

**Architecture:** Next.js 16 + TypeScript + Supabase (Authentication & Database) + Tailwind CSS

**Key Features:**
- Onboarding wizard (3 simple steps with progress tracking)
- Build tracker (4 phases over 14 days with status and checklists)
- Real-time project updates
- Kit-specific flows (Launch Kit vs Growth Kit)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Status Enum System](#status-enum-system)
3. [Client Dashboard Specifications](#client-dashboard-specifications)
4. [Database Schema Design](#database-schema-design)
5. [Supabase Configuration](#supabase-configuration)
6. [API Endpoints Structure](#api-endpoints-structure)
7. [TypeScript Type Definitions](#typescript-type-definitions)
8. [Implementation Guidelines](#implementation-guidelines)

---

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Project Structure
```
admin-dashboard/
├── app/
│   ├── page.tsx                 # Root page (redirects)
│   ├── layout.tsx               # Root layout
│   ├── login/                   # Client login
│   ├── home/                    # Home tab - project status
│   ├── launch-kit/              # Launch Kit tab
│   │   ├── onboarding/          # Onboarding wizard
│   │   │   ├── step-1/
│   │   │   ├── step-2/
│   │   │   └── step-3/
│   │   └── build-tracker/       # Build tracker view
│   └── growth-kit/              # Growth Kit tab
│       ├── onboarding/
│       │   ├── step-1/
│       │   ├── step-2/
│       │   └── step-3/
│       └── build-tracker/
├── components/
│   ├── ui/                      # UI components (shadcn/ui)
│   ├── onboarding/              # Onboarding components
│   └── tracker/                 # Build tracker components
├── utils/
│   └── supabase/
│       ├── client.ts            # Browser client
│       └── server.ts            # Server client
├── hooks/
│   └── useCurrentUser.ts        # User context hook
├── types/
│   └── project.ts               # TypeScript types
└── lib/
    └── utils.ts                 # Utility functions
```

---

## Status Enum System

Use the same status enums consistently throughout the application:

```typescript
type Status = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CLIENT'
  | 'DONE'
```

**Usage:**
- Onboarding steps: Track completion status
- Build phases: Track project progress
- Checklist items: Track individual task completion

**Status Flow:**
```
NOT_STARTED → IN_PROGRESS → WAITING_ON_CLIENT → DONE
```

---

## Client Dashboard Specifications

### Global Components

#### Project-Level Fields (Per Project)

```typescript
interface Project {
  id: string
  user_id: string                    // Foreign key to auth.users
  kit_type: 'LAUNCH' | 'GROWTH'      // Determines which flow to show
  onboarding_steps: OnboardingStep[] // Array of 3 steps
  phases: Phase[]                    // Array of 4 phases
  next_from_us: string               // PM update text
  next_from_you: string              // Client action text
  onboarding_percent: number         // 0-100
  current_day_of_14: number          // 1-14, optional, can be manual
  created_at: string
  updated_at: string
}
```

#### Onboarding Step Structure

```typescript
interface OnboardingStep {
  id: string                         // 'STEP_1', 'STEP_2', 'STEP_3'
  title: string                      // Display title
  status: Status                     // Current status
  required_fields_total: number      // Total required fields
  required_fields_completed: number  // Completed required fields
  time_estimate: string              // e.g., "About 5 minutes"
  fields: Record<string, any>        // Form data storage
}
```

#### Phase Structure

```typescript
interface Phase {
  id: string                         // 'PHASE_1', 'PHASE_2', etc.
  title: string                      // Display title
  subtitle: string                   // Brief description
  day_range: string                  // e.g., "Days 0-2"
  status: Status                     // Current phase status
  checklist: ChecklistItem[]         // Array of checklist items
  links: PhaseLink[]                 // Optional links (docs, staging, etc.)
}

interface ChecklistItem {
  label: string                      // Display text
  is_done: boolean                   // Completion status
}

interface PhaseLink {
  label: string                      // Display text
  url: string                        // Link URL
}
```

---

### 1. HOME Tab

**Purpose:** Show high-level status and what's next.

**UI Components:**

#### Project Status Widget
```
You are currently in: [phase.title]
```
- Derive from latest `phases[]` where `status === 'IN_PROGRESS'`
- If none, fallback to "Onboarding" or last `DONE` phase
- Get phase from: `phases.find(p => p.status === 'IN_PROGRESS') || phases.filter(p => p.status === 'DONE').pop()`

#### Next From Us Widget
```
[next_from_us field text]
```
- Display `next_from_us` from project record
- Updated by PM/admin

#### Next From You Widget
```
[next_from_you field text]
```
- Display `next_from_you` from project record
- Updated by PM/admin

#### Optional Widgets
- **Onboarding Progress:** `Onboarding: [onboarding_percent]% complete`
- **Day Counter:** `Today: Day [current_day_of_14] of 14`

---

### 2. LAUNCH KIT Tab

#### 2.1 Onboarding Wizard (Top Block)

**Hero Text:**
> "Launch Kit: Klaro will walk you through these steps so we can build your 3 page site in 14 days."

**Steps (Fixed - 3 total):**

1. **Step 1:** Tell us who you are - About 5 minutes
2. **Step 2:** Show us your brand - About 8 minutes
3. **Step 3:** Switch on the site - About 5 minutes

**Step Strip (Horizontal):**
- Show all 3 steps horizontally
- Each step shows: Title, status pill, small label ("About X minutes")
- Steps 2 and 3 are locked until previous step is `DONE`
- Under strip: `Step [n] of 3 · Onboarding [onboarding_percent]% complete`

**Data Source:** `project.onboarding_steps[0..2]`

**UI Behavior:**
- Click on step → Navigate to step form page
- Step status determines visual state (disabled, active, completed)
- Progress bar fills based on `required_fields_completed / required_fields_total`

---

#### Step 1: Tell us who you are

**Header:**
- Left: "Launch Kit – Step 1 of 3"
- Subtitle: "Tell us who you are and what you sell. This gives us the basics to start."
- Right Badge: "About 5 minutes" | "Required fields 0 / 6 complete"

**Progress Bar:**
- Thin bar showing Step 1 progress only
- Label: "Step 1 – Tell us who you are"
- Fills as required fields complete

**Layout:** Two columns (Form left, Guidance right)

**Left Column – Form Fields:**

**Card: About you and your business**

1. **Business name** (short text)
   - Label: "Business name"
   - Help text: "Exactly how you want it on the site."
   - Required

2. **Your name and role** (short text)
   - Label: "Your name and role"
   - Help text: "For example: Goodness Olawale, Founder."
   - Required

3. **Contact email** (email field)
   - Label: "Best contact email"
   - Help text: "We use this for project updates and contact form enquiries."
   - Required

4. **Phone or WhatsApp** (short text)
   - Label: "Phone or WhatsApp"
   - Help text: "Only used for project communication. We will not show it on the site unless you say yes."
   - Required

5. **Social links** (repeating pair)
   - Label: "Main social profiles"
   - Subfields: Platform (dropdown) + URL
   - Help text: "Instagram, LinkedIn or any place you want people to find you."
   - At least one required

**Card: Your main offer** (inside Step 1)

6. **What do you sell** (long text)
   - Label: "What do you sell in one or two sentences"
   - Required

7. **Who is this for** (long text)
   - Label: "Who is this for"
   - Required

**Right Column – Guidance:**

**Card 1: Why this step matters**
> "These answers help Klaro talk about you in simple language. Once this step is done, we can already start preparing for your brand call."

**Card 2: Required to continue**
- List of required fields
- Counter: "Required fields complete: X of 7"

**Card 3: Next from us**
> "Once Step 1 is complete, we will review your answers and send a link to book your brand call."

**Buttons:**
- Left: "Save and come back later" (gray link)
- Right: "Save and continue to Step 2" (primary button)
- Validation: If required fields missing, show: "Please complete the required fields marked with *."

**Completion:**
- When all required fields complete:
  - Step 1 status → `DONE`
  - Overall: `Onboarding 35% complete`
  - Step 2 becomes clickable

---

#### Step 2: Show us your brand

**Header:**
- Title: "Step 2 of 3 – Show us your brand"
- Subtitle: "Logo, colours, photos and who you serve."
- Badge: "About 8 minutes" | "Required fields 0 / 7 complete"

**Layout:** Same two-column layout

**Left Column – Form Fields:**

**Card A: Brand visuals**
1. **Logo upload** (file upload) - Required
2. **Brand colours** (color picker/hex) - Required
3. **Brand photos** (file upload multiple) - Required
4. **Inspiration sites** (URLs) - Optional

**Card B: Clients and proof**
5. **Ideal client description** (long text) - Required
6. **Top 3 problems** (3 short text fields) - Required
7. **Top 3 results** (3 short text fields) - Required
8. **Testimonials** (3-10, file upload or text) - Required
9. **Review links** (URLs) - Optional

**Card C: Voice and vibe**
10. **3 voice words** (multi-select or 3 fields) - Required
11. **Words or phrases to avoid** (long text) - Optional

**Right Column:**
- Why this step matters
- Required to continue (list + counter)
- Next from us: "Once this step is done, we can lock your message and start writing your copy."

**Buttons:**
- Back to Step 1
- Save and continue to Step 3

**Completion Banner (if Steps 1 & 2 complete):**
> ✅ "You have given us enough to start building your site. We can begin once you complete Step 3 or on our next call."

---

#### Step 3: Switch on the site

**Header:**
- Title: "Step 3 of 3 – Switch on the site"
- Subtitle: "Domain, forms and anything we need to launch."
- Badge: "About 5 minutes" | "Required fields 0 / 4 complete"

**Left Column – Form Fields:**

**Card: Tech and launch**
1. **Domain provider** (dropdown) - Required
2. **Existing site platform** (text) - Optional
3. **How you will share access** (long text) - Required
4. **Email for contact form** (email) - Required
5. **Privacy/terms link** (URL) - Optional

**Right Column:**
- Why this step matters: "This is what lets us connect your domain and test forms before launch."
- Required to finish
- Next from us: "Once this step is done, we prepare your site for launch."

**Buttons:**
- Back to Step 2
- Primary: "Finish onboarding"

**Success State (after completion):**
```
Onboarding complete
You have finished all three steps.
Klaro now has everything it needs to start your Launch Kit project.
You will see live updates in your dashboard as we move through copy, design and launch.
```

---

#### 2.2 Build Tracker (Second Block)

**Title:** "Launch Kit – Build progress (14 days)"

**Phase Strip (Horizontal):**
1. Phase 1 – Inputs & clarity (Days 0-2)
2. Phase 2 – Words that sell (Days 3-5)
3. Phase 3 – Design & build (Days 6-10)
4. Phase 4 – Test & launch (Days 11-14)

**Data Source:** `project.phases[]` where `kit_type === 'LAUNCH'`

**UI Behavior:**
- Show phase strip with status pills
- Expand current phase (first with `IN_PROGRESS` or `WAITING_ON_CLIENT`)
- Inside expanded card:
  - Checklist with checkmarks
  - Optional links
  - Right side/bottom:
    - "Next from us": `next_from_us`
    - "Next from you": `next_from_you`

**Phase Details:**

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
- Links: "View copy doc"
- Next from us: "We are drafting your homepage and offer page copy."
- Next from you: "Please review your copy and leave one round of comments."

**Phase 3: Design & build (Days 6-10)**
- Subtitle: "We turn copy into a 3 page site."
- Checklist:
  - ☐ Site layout built for all 3 pages
  - ☐ Mobile checks done
  - ☐ Testimonials and proof added
  - ☐ Staging link shared with you
- Links: "View staging site"
- Next from us: "We are building your 3 page site using your approved copy."
- Next from you: "Please click through the staging site and flag any small tweaks."

**Phase 4: Test & launch (Days 11-14)**
- Subtitle: "We connect domain, test and go live."
- Checklist:
  - ☐ Forms tested
  - ☐ Domain connected
  - ☐ Final tweaks applied
  - ☐ Loom walkthrough recorded and shared
- Links: "View live site", "Watch Loom walkthrough"
- Next from us: "We are testing your contact form and connecting your domain."
- Next from you: "Please confirm everything looks good and share any final non-urgent tweaks."

---

### 3. GROWTH KIT Tab

Same structure as Launch Kit, different labels and steps.

#### 3.1 Onboarding Wizard

**Hero Text:**
> "Growth Kit: Klaro will help you set up the pieces we need to build your funnel and emails in 14 days."

**Steps (Fixed - 3 total):**
1. **Step 1:** Snapshot and main offer - About 8 minutes
2. **Step 2:** Clients, proof and content fuel - About 10 minutes
3. **Step 3:** Systems and launch - About 7 minutes

**Data Source:** `project.onboarding_steps[0..2]` with Growth Kit titles

---

#### Step 1: Snapshot and main offer

**Header:**
- Title: "Growth Kit – Step 1 of 3"
- Subtitle: "Snapshot of your business and the main offer this funnel is built around."
- Badge: "About 8 minutes" | "Required fields 0 / 12 complete"

**Left Column – Form Fields:**

**Card A: Business snapshot**
1. Business name (short text) - Required
2. Your name and role (short text) - Required
3. Monthly revenue band (dropdown) - Required
   - Options: Under £10K, £10K to £20K, £20K to £35K, £35K to £50K, Over £50K
4. Where you operate (long text) - Required
5. Current website URL (URL) - Optional
6. Main channels (multi-select) - Required
   - Options: Instagram, LinkedIn, TikTok, YouTube, Email list, Paid ads, Other

**Card B: The offer we are backing**
7. Offer name (short text) - Required
8. Who this offer is for (long text) - Required
9. What is included (long text/bullet list) - Required
10. How you deliver it (multi-select) - Required
    - Options: 1:1, Group, Done for you, Hybrid, Self paced, Other
11. Typical timeline (short text) - Required
12. Pricing and payment options (long text) - Required
13. How to show pricing (dropdown) - Required
    - Options: Full prices, From £X, No prices shown

**Right Column:**
- Why this step matters
- Required to continue (list + counter: "Required fields complete: X of 12")
- Next from us: "Once Step 1 is complete, we will review your answers and start shaping your funnel plan."

**Buttons:**
- Save and come back later
- Save and continue to Step 2

**Completion:**
- Step 1 → `DONE`
- Overall: `Onboarding 35% complete`
- Step 2 becomes active

---

#### Step 2: Clients, proof and content fuel

**Header:**
- Title: "Growth Kit – Step 2 of 3"
- Subtitle: "Clients, proof and content that feeds your funnel."
- Badge: "About 10 minutes" | "Required fields 0 / 9 complete"

**Left Column – Form Fields:**

**Card A: Your people**
1. Ideal client description (long text) - Required
2. Top 5 pains (5 short fields or long text) - Required
3. Top 5 outcomes (5 short fields or long text) - Required
4. Common objections (long text or multiple fields) - Required
5. Reasons people choose you (long text) - Optional
6. Competitors or alternatives (long text) - Optional

**Card B: Voice and proof**
7. 3 words for your voice (multi-select or 3 fields) - Required
8. Words or phrases to avoid (long text) - Optional
9. Testimonials (5-15, file upload or text) - Required
10. Case study outlines (3-5, repeating group) - Required
    - Subfields: Client type, Problem, What you did, Result
11. Review links (repeating URL) - Optional
12. Logos, awards, features (file upload + text) - Optional

**Card C: Content fuel**
13. Top 10 buyer questions (long text or repeating fields) - Required
14. 3 common mistakes or myths (long text or 3 fields) - Required
15. Topics to be known for (long text) - Optional
16. Existing lead magnet (file or URL) - Optional
17. Keep or replace lead magnet (dropdown) - Optional
    - Options: Keep and improve it, Replace it, Not sure

**Right Column:**
- Why this step matters: "This is where your funnel gets its edge..."
- Required to continue (list + counter: "Required fields complete: X of 9")
- Next from us: "Once Step 2 is complete, we will lock in your message and start drafting your site copy and email sequence."

**Buttons:**
- Back to Step 1
- Save and continue to Step 3

**Completion Banner:**
> ✅ "You have given us enough to start building your funnel. We can begin once you complete Step 3 or on our next call."

---

#### Step 3: Systems and launch

**Header:**
- Title: "Growth Kit – Step 3 of 3"
- Subtitle: "Website, email, tracking and how we will work together."
- Badge: "About 7 minutes" | "Required fields 0 / X complete"

**Left Column – Form Fields:**

**Card A: Website and domain**
1. What your current site is built on (dropdown) - Required
2. How we get access to your site (long text) - Required
3. Where your domain is registered (dropdown) - Required
4. How we get DNS access or tech contact (long text) - Required

**Card B: Email, booking and CRM**
5. Email platform (dropdown) - Required
6. How we get email platform access (long text) - Required
7. Booking link or system (URL) - Required
8. Do you use a CRM (dropdown) - Optional
   - Options: None, HubSpot, Pipedrive, Close, Other
   - If not None: additional fields for details and access

**Card C: Tracking and policies**
9. What tracking and ads you use (multi-select) - Required
   - Options: Google Analytics, Google Tag Manager, Meta Ads, LinkedIn Ads, Google Ads, Other
10. Privacy policy link (URL) - Required
11. Terms and conditions link (URL) - Optional
12. Any required disclaimers (long text) - Optional

**Card D: How we work together**
13. Who makes final decisions (short text) - Required
14. Secondary contact (short text) - Optional
15. Preferred communication channel (dropdown) - Required
    - Options: Email, WhatsApp, Slack, Other
16. How quickly you can review (dropdown) - Required
    - Options: Within 24 hours, Within 48 hours, Within 3 days
17. Dates offline in next 14 days (long text or date range) - Optional
18. Main traffic focus after launch (multi-select) - Required
    - Options: Instagram, LinkedIn, Email list, Paid ads, SEO, Other

**Right Column:**
- Why this step matters: "This is the part that connects everything..."
- Required to finish (list + counter)
- Next from us: "Once Step 3 is complete, we can start building and wiring your funnel."

**Buttons:**
- Back to Step 2
- Primary: "Finish onboarding"

**Success State:**
```
Growth Kit onboarding complete
You have finished all three steps. Klaro now has what it needs to build your funnel.
Look at your Home screen to see what we are working on next.
```

---

#### 3.2 Build Tracker

**Title:** "Growth Kit – Build progress (14 days)"

**Phase Strip:**
1. Phase 1 – Strategy locked in (Days 0-2)
2. Phase 2 – Copy & email engine (Days 3-5)
3. Phase 3 – Build the funnel (Days 6-10)
4. Phase 4 – Test, launch & handover (Days 11-14)

**Phase Details:**

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
- Links: "View website copy", "View email sequence"
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
- Links: "View staging funnel"
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
- Links: "View live funnel", "Watch Loom walkthrough"
- Next from us: "We are testing your funnel, connecting the domain and switching on your emails."
- Next from you: "Please confirm you are happy with the live version and share any early feedback."

---

## Database Schema Design

### Core Tables

#### 1. Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_type TEXT NOT NULL CHECK (kit_type IN ('LAUNCH', 'GROWTH')),
  
  -- Progress tracking
  onboarding_percent INTEGER DEFAULT 0 CHECK (onboarding_percent >= 0 AND onboarding_percent <= 100),
  current_day_of_14 INTEGER CHECK (current_day_of_14 >= 1 AND current_day_of_14 <= 14),
  
  -- Communication fields
  next_from_us TEXT,
  next_from_you TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, kit_type) -- One project per kit type per user
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can update all projects
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );
```

#### 2. Onboarding Steps Table

```sql
CREATE TABLE onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number >= 1 AND step_number <= 3),
  step_id TEXT NOT NULL, -- 'STEP_1', 'STEP_2', 'STEP_3'
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'DONE')),
  required_fields_total INTEGER DEFAULT 0,
  required_fields_completed INTEGER DEFAULT 0,
  time_estimate TEXT, -- e.g., "About 5 minutes"
  fields JSONB, -- Store form data as JSON
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, step_number)
);

-- Enable RLS
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view steps for their projects"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps for their projects"
  ON onboarding_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = onboarding_steps.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all steps"
  ON onboarding_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all steps"
  ON onboarding_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );
```

#### 3. Phases Table

```sql
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 4),
  phase_id TEXT NOT NULL, -- 'PHASE_1', 'PHASE_2', etc.
  title TEXT NOT NULL,
  subtitle TEXT,
  day_range TEXT NOT NULL, -- e.g., "Days 0-2"
  status TEXT NOT NULL DEFAULT 'NOT_STARTED' CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'DONE')),
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(project_id, phase_number)
);

-- Enable RLS
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as onboarding_steps)
CREATE POLICY "Users can view phases for their projects"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all phases"
  ON phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all phases"
  ON phases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );
```

#### 4. Checklist Items Table

```sql
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_done BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view checklist items for their projects"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM phases 
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = checklist_items.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all checklist items"
  ON checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all checklist items"
  ON checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );
```

#### 5. Phase Links Table

```sql
CREATE TABLE phase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE phase_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern - users view, admins can manage)
CREATE POLICY "Users can view phase links for their projects"
  ON phase_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM phases 
      JOIN projects ON projects.id = phases.project_id
      WHERE phases.id = phase_links.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all phase links"
  ON phase_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );
```

### Initialization Script

**Important:** When creating a new project, you must initialize it with the default steps and phases based on kit type.

```sql
-- Function to initialize Launch Kit project
CREATE OR REPLACE FUNCTION initialize_launch_kit_project(p_project_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert onboarding steps
  INSERT INTO onboarding_steps (project_id, step_number, step_id, title, time_estimate, required_fields_total)
  VALUES
    (p_project_id, 1, 'STEP_1', 'Tell us who you are', 'About 5 minutes', 7),
    (p_project_id, 2, 'STEP_2', 'Show us your brand', 'About 8 minutes', 7),
    (p_project_id, 3, 'STEP_3', 'Switch on the site', 'About 5 minutes', 4);
  
  -- Insert phases
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 1, 'PHASE_1', 'Inputs & clarity', 'Lock the message and plan.', 'Days 0-2'),
    (p_project_id, 2, 'PHASE_2', 'Words that sell', 'We write your 3 pages.', 'Days 3-5'),
    (p_project_id, 3, 'PHASE_3', 'Design & build', 'We turn copy into a 3 page site.', 'Days 6-10'),
    (p_project_id, 4, 'PHASE_4', 'Test & launch', 'We connect domain, test and go live.', 'Days 11-14');
  
  -- Insert checklist items for Phase 1
  INSERT INTO checklist_items (phase_id, label, sort_order)
  SELECT id, label, sort_order
  FROM phases,
  (VALUES
    ('Onboarding steps completed', 1),
    ('Brand / strategy call completed', 2),
    ('14 day plan agreed', 3)
  ) AS items(label, sort_order)
  WHERE phases.project_id = p_project_id AND phases.phase_number = 1;
  
  -- Insert checklist items for other phases similarly...
  -- (Continue for all phases with appropriate checklist items)
END;
$$ LANGUAGE plpgsql;

-- Function to initialize Growth Kit project (similar structure)
CREATE OR REPLACE FUNCTION initialize_growth_kit_project(p_project_id UUID)
RETURNS void AS $$
BEGIN
  -- Insert onboarding steps for Growth Kit
  INSERT INTO onboarding_steps (project_id, step_number, step_id, title, time_estimate, required_fields_total)
  VALUES
    (p_project_id, 1, 'STEP_1', 'Snapshot and main offer', 'About 8 minutes', 12),
    (p_project_id, 2, 'STEP_2', 'Clients, proof and content fuel', 'About 10 minutes', 9),
    (p_project_id, 3, 'STEP_3', 'Systems and launch', 'About 7 minutes', 10);
  
  -- Insert phases for Growth Kit
  INSERT INTO phases (project_id, phase_number, phase_id, title, subtitle, day_range)
  VALUES
    (p_project_id, 1, 'PHASE_1', 'Strategy locked in', 'Offer, goal and funnel map agreed.', 'Days 0-2'),
    (p_project_id, 2, 'PHASE_2', 'Copy & email engine', 'We write your site copy and 5 emails.', 'Days 3-5'),
    (p_project_id, 3, 'PHASE_3', 'Build the funnel', 'Pages, lead magnet and blog hub built.', 'Days 6-10'),
    (p_project_id, 4, 'PHASE_4', 'Test, launch & handover', 'We test the full journey and go live.', 'Days 11-14');
  
  -- Insert checklist items for each phase...
  -- (Similar pattern as Launch Kit but with Growth Kit specific items)
END;
$$ LANGUAGE plpgsql;
```

### Helper Functions

```sql
-- Function to calculate onboarding percentage
CREATE OR REPLACE FUNCTION calculate_onboarding_percent(p_project_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_required INTEGER;
  total_completed INTEGER;
BEGIN
  SELECT 
    COALESCE(SUM(required_fields_total), 0),
    COALESCE(SUM(required_fields_completed), 0)
  INTO total_required, total_completed
  FROM onboarding_steps
  WHERE project_id = p_project_id;
  
  IF total_required = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND((total_completed::FLOAT / total_required::FLOAT) * 100);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update onboarding_percent
CREATE OR REPLACE FUNCTION update_onboarding_percent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET onboarding_percent = calculate_onboarding_percent(NEW.project_id),
      updated_at = NOW()
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_percent
AFTER INSERT OR UPDATE ON onboarding_steps
FOR EACH ROW
EXECUTE FUNCTION update_onboarding_percent();
```

---

## Supabase Configuration

### Environment Variables

The application requires these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the browser (server-side only)
- Set these in Vercel: Project Settings → Environment Variables

### Client Setup

#### Browser Client (`utils/supabase/client.ts`)

```typescript
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const createClient = () => {
  // Check if we're in the browser and have environment variables
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be created in the browser')
  }

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
```

**Usage:** Use in client components, React hooks, and browser-only code.

#### Server Client (`utils/supabase/server.ts`)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const createClient = async () => {
  // Validate environment variables before creating client
  if (!supabaseUrl || !supabaseKey) {
    const missingVars = []
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}. ` +
      `Please check your Vercel project settings and ensure these variables are set.`
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

**Usage:** Use in Server Components, API routes, and server-side code.

### Authentication Setup

The application uses Supabase Auth for user authentication.

**Current Setup:**
1. Users authenticate via Supabase Auth
2. User records are stored in `auth.users` (managed by Supabase)
3. Admin users are stored in `admins` table with foreign key to `auth.users`
4. Client users will have records in `projects` table linked to `auth.users`

**User Flow:**
1. User signs up/logs in → Supabase Auth
2. User ID from `auth.users` → Used for `projects.user_id`
3. Project data fetched based on authenticated `user_id`

### Row Level Security (RLS) Policies

All tables have RLS enabled for security:

**Pattern:**
- Users can view/update their own projects
- Admins can view/update all projects
- Service role key (server-side) bypasses RLS when needed

**Example RLS Policy:**
```sql
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

### Realtime Subscriptions

For live updates, use Supabase Realtime:

```typescript
// Example: Subscribe to project updates
const supabase = createClient()

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
      console.log('Project updated:', payload)
      // Update UI
    }
  )
  .subscribe()
```

**Enable Realtime:**
```sql
-- Enable Realtime for projects table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_steps;
ALTER PUBLICATION supabase_realtime ADD TABLE phases;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
```

---

## API Endpoints Structure

### Client-Facing API Routes

#### Get User's Project
```
GET /api/projects
```
- Returns: User's project for their kit type
- Auth: Required (uses authenticated user_id)

#### Get Onboarding Steps
```
GET /api/projects/[projectId]/onboarding
```
- Returns: Array of onboarding steps with progress
- Auth: Required

#### Update Onboarding Step
```
PUT /api/projects/[projectId]/onboarding/[stepId]
```
- Body: `{ fields: {...}, required_fields_completed: number }`
- Updates step fields and completion status
- Auth: Required (only owner can update)

#### Get Phases
```
GET /api/projects/[projectId]/phases
```
- Returns: Array of phases with checklists and links
- Auth: Required

### Admin/PM API Routes

#### Create/Initialize Project
```
POST /api/admin/projects
```
- Body: `{ user_id: string, kit_type: 'LAUNCH' | 'GROWTH' }`
- Creates project and initializes steps/phases
- Auth: Admin only

#### Update Phase Status
```
PUT /api/admin/projects/[projectId]/phases/[phaseId]
```
- Body: `{ status: Status, checklist: ChecklistItem[], next_from_us?: string, next_from_you?: string }`
- Updates phase status and checklist
- Auth: Admin only

#### Update Project Progress
```
PUT /api/admin/projects/[projectId]
```
- Body: `{ current_day_of_14?: number, next_from_us?: string, next_from_you?: string }`
- Updates project-level fields
- Auth: Admin only

------

## .env configurations
NEXT_PUBLIC_SUPABASE_URL=https://eohxojcymgjhknkorrnm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvaHhvamN5bWdqaGtua29ycm5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDg2NDQsImV4cCI6MjA3NzA4NDY0NH0.kJTWSMjjfXLc12RosbDn95vovFJMhOJqILHXQFPa4MY

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvaHhvamN5bWdqaGtua29ycm5tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwODY0NCwiZXhwIjoyMDc3MDg0NjQ0fQ.ysju08_DtNKRDadzq_J7_EzOy4UErJpqpebXqD1uffk

--------

## TypeScript Type Definitions

### Core Types

```typescript
// Status enum
type Status = 
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'WAITING_ON_CLIENT'
  | 'DONE'

// Kit type
type KitType = 'LAUNCH' | 'GROWTH'

// Project interface
interface Project {
  id: string
  user_id: string
  kit_type: KitType
  onboarding_percent: number
  current_day_of_14: number | null
  next_from_us: string | null
  next_from_you: string | null
  created_at: string
  updated_at: string
}

// Onboarding step
interface OnboardingStep {
  id: string
  project_id: string
  step_number: number
  step_id: string
  title: string
  status: Status
  required_fields_total: number
  required_fields_completed: number
  time_estimate: string
  fields: Record<string, any> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Phase
interface Phase {
  id: string
  project_id: string
  phase_number: number
  phase_id: string
  title: string
  subtitle: string | null
  day_range: string
  status: Status
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  checklist?: ChecklistItem[]
  links?: PhaseLink[]
}

// Checklist item
interface ChecklistItem {
  id: string
  phase_id: string
  label: string
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// Phase link
interface PhaseLink {
  id: string
  phase_id: string
  label: string
  url: string
  sort_order: number
  created_at: string
}

// Project with relations (for API responses)
interface ProjectWithRelations extends Project {
  onboarding_steps: OnboardingStep[]
  phases: Phase[]
}

// Home widget data
interface HomeWidgetData {
  currentPhase: Phase | null
  nextFromUs: string | null
  nextFromYou: string | null
  onboardingPercent: number
  currentDay: number | null
}
```

---

## Implementation Guidelines

### 1. Fetching User's Preferred Kit

**Key Implementation:** The dashboard must fetch the user's preferred kit type to show the correct flow.

**API Endpoint:**
```typescript
// GET /api/projects
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Fetch user's project
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      onboarding_steps (*),
      phases (
        *,
        checklist_items (*),
        phase_links (*)
      )
    `)
    .eq('user_id', user.id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // If no project exists, return null (client will initialize)
  return NextResponse.json({ project: project || null })
}
```

**Usage in Components:**
```typescript
// In a client component
const { data: project, isLoading } = useSWR('/api/projects', fetcher)

if (isLoading) return <Loading />
if (!project) return <InitializeProject />

// Route based on kit_type
if (project.kit_type === 'LAUNCH') {
  return <LaunchKitFlow project={project} />
} else if (project.kit_type === 'GROWTH') {
  return <GrowthKitFlow project={project} />
}
```

### 2. Project Initialization

When a user first accesses the dashboard:

```typescript
// POST /api/projects/initialize
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { kit_type } = await request.json()
  
  if (!kit_type || !['LAUNCH', 'GROWTH'].includes(kit_type)) {
    return NextResponse.json({ error: 'Invalid kit type' }, { status: 400 })
  }
  
  // Check if project already exists
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('kit_type', kit_type)
    .single()
  
  if (existing) {
    return NextResponse.json({ error: 'Project already exists' }, { status: 400 })
  }
  
  // Use service role for initialization (bypasses RLS)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Create project
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: user.id,
      kit_type,
      onboarding_percent: 0
    })
    .select()
    .single()
  
  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 })
  }
  
  // Initialize steps and phases based on kit type
  if (kit_type === 'LAUNCH') {
    await supabaseAdmin.rpc('initialize_launch_kit_project', {
      p_project_id: project.id
    })
  } else {
    await supabaseAdmin.rpc('initialize_growth_kit_project', {
      p_project_id: project.id
    })
  }
  
  return NextResponse.json({ success: true, project })
}
```

### 3. Onboarding Step Updates

Update step progress as user fills forms:

```typescript
// PUT /api/projects/[projectId]/onboarding/[stepId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string, stepId: string }> }
) {
  const { projectId, stepId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }
  
  const body = await request.json()
  const { fields, required_fields_completed } = body
  
  // Update step
  const { data: step, error } = await supabase
    .from('onboarding_steps')
    .update({
      fields,
      required_fields_completed,
      status: required_fields_completed === required_fields_total ? 'DONE' : 'IN_PROGRESS',
      updated_at: new Date().toISOString(),
      completed_at: required_fields_completed === required_fields_total 
        ? new Date().toISOString() 
        : null
    })
    .eq('id', stepId)
    .eq('project_id', projectId)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, step })
}
```

### 4. Home Tab Implementation

```typescript
// app/home/page.tsx
'use client'

import { useSWR } from 'swr'

export default function HomePage() {
  const { data, isLoading } = useSWR('/api/projects', fetcher)
  
  if (isLoading) return <Loading />
  if (!data?.project) return <InitializeProjectPrompt />
  
  const { project } = data
  const currentPhase = project.phases.find(p => p.status === 'IN_PROGRESS') 
    || project.phases.filter(p => p.status === 'DONE').pop()
  
  return (
    <div>
      <h1>Home</h1>
      
      {/* Project Status Widget */}
      <Widget>
        <h2>You are currently in:</h2>
        <p>{currentPhase?.title || 'Onboarding'}</p>
      </Widget>
      
      {/* Next From Us */}
      <Widget>
        <h2>Next from us</h2>
        <p>{project.next_from_us || 'No updates yet.'}</p>
      </Widget>
      
      {/* Next From You */}
      <Widget>
        <h2>Next from you</h2>
        <p>{project.next_from_you || 'Nothing for now.'}</p>
      </Widget>
      
      {/* Progress */}
      <Widget>
        <p>Onboarding: {project.onboarding_percent}% complete</p>
        {project.current_day_of_14 && (
          <p>Today: Day {project.current_day_of_14} of 14</p>
        )}
      </Widget>
    </div>
  )
}
```

### 5. Admin/PM Update Functions

PM needs simple functions to update project progress:

```typescript
// PUT /api/admin/projects/[projectId]/phases/[phaseId]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string, phaseId: string }> }
) {
  // Verify admin access
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user?.id)
    .single()
  
  if (!admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }
  
  const { projectId, phaseId } = await params
  const body = await request.json()
  const { status, checklist, next_from_us, next_from_you } = body
  
  // Use service role for admin updates
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Update phase
  const { error: phaseError } = await supabaseAdmin
    .from('phases')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', phaseId)
  
  if (phaseError) {
    return NextResponse.json({ error: phaseError.message }, { status: 500 })
  }
  
  // Update checklist items
  if (checklist) {
    for (const item of checklist) {
      await supabaseAdmin
        .from('checklist_items')
        .update({ is_done: item.is_done })
        .eq('id', item.id)
    }
  }
  
  // Update project next_from_us/next_from_you
  if (next_from_us !== undefined || next_from_you !== undefined) {
    await supabaseAdmin
      .from('projects')
      .update({
        next_from_us: next_from_us ?? undefined,
        next_from_you: next_from_you ?? undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
  }
  
  return NextResponse.json({ success: true })
}
```

---

## Admin/PM Workflow

### Simple Update Checklist

When PM moves a project in ClickUp, they update:

1. **Phase Status**
   - Change `phases[].status` from `IN_PROGRESS` → `WAITING_ON_CLIENT` → `DONE`

2. **Checklist Items**
   - Toggle `checklist_items[].is_done` to `true` as tasks complete

3. **Communication Fields**
   - Update `next_from_us` with what PM is working on
   - Update `next_from_you` with what client needs to do

4. **Day Counter (Optional)**
   - Update `current_day_of_14` as project progresses

**Admin UI Example:**
```typescript
// Simple admin form to update phase
<PhaseUpdateForm phase={phase}>
  <Select 
    value={phase.status}
    onChange={(status) => updatePhaseStatus(status)}
  >
    <option value="NOT_STARTED">Not Started</option>
    <option value="IN_PROGRESS">In Progress</option>
    <option value="WAITING_ON_CLIENT">Waiting on Client</option>
    <option value="DONE">Done</option>
  </Select>
  
  <Checklist 
    items={phase.checklist}
    onToggle={(itemId, isDone) => updateChecklistItem(itemId, isDone)}
  />
  
  <Textarea 
    label="Next from us"
    value={project.next_from_us}
    onChange={(text) => updateNextFromUs(text)}
  />
  
  <Textarea 
    label="Next from you"
    value={project.next_from_you}
    onChange={(text) => updateNextFromYou(text)}
  />
</PhaseUpdateForm>
```

---

## Next Steps for Implementation

1. **Database Setup**
   - Run SQL scripts to create tables
   - Set up RLS policies
   - Create initialization functions
   - Enable Realtime subscriptions

2. **API Development**
   - Build client-facing endpoints
   - Build admin/PM endpoints
   - Add error handling and validation

3. **Component Development**
   - Build onboarding wizard components
   - Build build tracker components
   - Build Home tab components
   - Add progress bars and status indicators

4. **Routing & Navigation**
   - Set up conditional routing based on `kit_type`
   - Implement step locking logic
   - Add navigation guards

5. **Testing**
   - Test onboarding flows
   - Test build tracker updates
   - Test admin update flows
   - Test kit type switching

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Status: Technical Specification*

