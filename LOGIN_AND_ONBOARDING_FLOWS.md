# Klarnow Client Dashboard – UX & Flow Specification

## 1. Overview

Each client has one active project, which is either:

* Launch Kit (3-page site)
* Growth Kit (4–6 page funnel)

Both project types use the same data structure:

* Onboarding (3 steps)
* Build tracker (4 phases across 14 days)
* "Next from us" and "Next from you" fields

Backend provides the complete project object for rendering.

---

## 2. Global Data Model

### 2.1 Status Enums

```
NOT_STARTED
IN_PROGRESS
WAITING_ON_CLIENT
DONE
```

### 2.2 Project Object

```
Project {
  kit_type: "LAUNCH" | "GROWTH"

  onboarding_steps: [
    { id, title, status, required_fields_total, required_fields_completed }
  ],

  phases: [
    { id, title, day_range, status, checklist: [...], links: [...] }
  ],

  next_from_us: string,
  next_from_you: string,

  onboarding_percent: number,
  current_day_of_14?: number
}
```

---

## 3. Home Tab – UX & Logic

### 3.1 Purpose

Provides a high-level overview of:

* Current phase
* What Klaro is doing next
* What the client must do next

### 3.2 UI Sections

**A. Project Status**
Displays the current phase title.

**Logic:**

1. First phase with status IN_PROGRESS
2. Else first with WAITING_ON_CLIENT
3. Else last with DONE
4. Else show "Onboarding"

**B. Next from us**
Displays text from backend.

**C. Next from you**
Displays text from backend.

**D. Optional**

* Onboarding %
* Day counter: "Day {x} of 14"

---

## 4. Launch Kit Tab – UX & Flow

### 4.1 Structure

1. Onboarding (3 steps)
2. Build tracker (4 phases)

---

## 5. Onboarding (3 Steps)

### Step Strip Component

Shows:

* Step title
* Status pill
* Time estimate

**Locked Logic**

* Step 1 unlocked
* Step 2 locked unless Step 1 = DONE
* Step 3 locked unless Step 2 = DONE

### Under the Strip

```
Step X of 3 • Onboarding XX% complete
```

### Step Click Logic

* If locked → no action
* If unlocked → open form

---

## 6. Step Pages (Forms)

Each step screen includes:

**Header**

* Step number
* Time estimate
* Required field counter

**Progress Bar**
Shows progress of the step.

**Two-Column Layout**

* Left: Form fields
* Right: Guidance cards

**Buttons**

* Save and come back later
* Save and continue to next step

**Validation**
Required fields must be complete to continue.

**Completion**
Completing a step:

* Marks status DONE
* Updates onboarding percentage
* Unlocks next step

### After Step 3

Show success message:

```
Onboarding complete
```

Build tracker becomes active.

---

## 7. Build Tracker

### 7.1 Top Section

Title:

```
Launch Kit – Build Progress (14 days)
```

### 7.2 Phase Strip

Each phase shows:

* Title
* Day range
* Status pill

### 7.3 Expanded Phase

Automatically expands the first phase where:

* status = IN_PROGRESS, or
* status = WAITING_ON_CLIENT

**Expanded Content**:

* Checklist
* Links
* Next from us
* Next from you

### Completion

When all phases DONE:

```
Project completed 🎉
```

---

## 8. Growth Kit Tab

Identical to Launch Kit in structure and logic.

Only differences:

* Step titles
* Form fields
* Phase names and checklists

---

## 9. Backend Update Flow (PM/Admin)

PM can update:

* Onboarding step statuses
* Required field counts
* Phase statuses
* Checklist completion
* Next from us/you
* Day count

Clients cannot update statuses.

---

## 10. Frontend Logic Summary

### 10.1 Step Unlocking

```
Step1: always unlocked
Step2: unlocked if Step1 DONE
Step3: unlocked if Step2 DONE
```

### 10.2 Phase Expansion

```
Expand first phase where status = IN_PROGRESS or WAITING_ON_CLIENT
Else expand first phase
```

### 10.3 Onboarding %

Provided by backend.

### 10.4 Current State Display

Used on Home tab.

---

## 11. Component Library

Reusable components:

* Status Pill
* Step Strip
* Phase Strip
* Checklist
* Link List
* Next Boxes
* Progress Bar
* Required Field Counter
* Two-Column Layout
* Success Screen

Forms use schemas per kit.

---

## 12. Full User Flow

### A. Onboarding

1. User opens kit tab
2. Completes Step 1 → Step 2 unlocks
3. Completes Step 2 → Step 3 unlocks
4. Completes Step 3 → onboarding marked complete
5. Build tracker activates

### B. Build Tracker

1. User views phases
2. Current phase expands
3. PM updates progress
4. All phases completed → final message

---

## 13. Developer Setup

### Routes

```
/home
/launch-kit
/growth-kit
/onboarding/step/:id
/settings (optional)
```

### API Endpoints

```
GET /project
PATCH /project/onboarding/step/:id
PATCH /project/phases/:id
PATCH /project/next
PATCH /project/day
```

---

## 14. Implementation Guidelines

* Required fields must be visually clear
* Progress always visible
* Phases open immediately
* Wording must match specification exactly
