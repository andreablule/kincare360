# Task: Family Plan Dashboard - Show 2 Patient Profiles

## Problem
When a user has a Family plan (ESSENTIAL_FAMILY, PLUS_FAMILY, CONCIERGE_FAMILY), they should see 2 patient profiles on their dashboard. Currently only 1 shows.

## Data Model
The schema already supports 1 user -> many patients (User.patients is a Patient[] relation). So the DB side is fine.

## What needs to change

### 1. Dashboard Overview (src/app/dashboard/page.tsx or similar)
- If user's plan contains "_FAMILY", fetch ALL patients for that user (not just the first)
- Show a patient switcher/tabs at the top: "Parent 1: [Name]" | "Parent 2: [Name]"
- OR show both profiles side by side in a 2-column layout
- Each patient should show their own: check-in time, medication reminders, recent call, appointments
- Whichever approach looks cleaner, do that

### 2. Dashboard Sub-pages (profile, medical, family, etc)
- If family plan, add a patient selector/tab at the top of each sub-page
- The selected patient's data loads below
- Default to the first patient, allow switching to the second

### 3. Add Second Patient Flow
- If a family plan user only has 1 patient created, show an "Add Second Parent" button/card on the dashboard
- Clicking it should open a simplified intake form for the second parent (name, phone, DOB, medications, doctors, etc)
- Save as a new Patient record linked to the same userId

### 4. Intake Flow Update
- After signup with a family plan, the intake form should say "Let's set up care for your first parent"
- After completing the first parent, show "Add your second parent" with another intake form
- Or allow them to skip and add later from the dashboard

### 5. Display the plan name nicely
- "CONCIERGE_FAMILY" should display as "Concierge Family" (not the raw DB value)
- Same for ESSENTIAL_FAMILY -> "Essential Family", PLUS_FAMILY -> "Plus Family"

## Git
Commit: "feat: family plan dashboard - 2 patient profiles with switcher"
Push to main.

When completely finished, run this command:
openclaw system event --text "Done: Family plan dashboard shows 2 patient profiles with switcher + add second parent flow" --mode now
