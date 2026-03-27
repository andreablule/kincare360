# Task: Family Plan Checkout + Concierge Phone Settings

## 1. FAMILY PLAN UPGRADE PATH ON WEBSITE + STRIPE CHECKOUT

Currently the website only shows individual plans for signup/checkout. Add the ability to select Family plans.

Check the current signup/checkout flow (register page, pricing page, checkout route) and add:
- On the pricing page: each plan should have both Individual and Family pricing visible with a toggle or tab (if not already done)
- On signup/register/checkout: allow selecting Family plan variants
- In the checkout route (src/app/api/checkout or similar): make sure the family plan Stripe price IDs are wired up:
  - Essential Family $75 -> price_1TFgePJlUr03cRD7o3hb9ZGN
  - Plus Family $130 -> price_1TFgeRJlUr03cRD7OIIRu8kg
  - Concierge Family $180 -> price_1TFgeSJlUr03cRD7BAJ0XDzT
- The family plan toggle/selector should be clear: "Individual" vs "Family (2 Parents)"
- When family plan is selected, checkout creates the Stripe session with the family price ID
- Dashboard plan page should also show family plan details and allow upgrading from individual to family (or switching between family tiers)

Also check the stripe-webhook to make sure it maps family price IDs to the correct plan names (essential_family, plus_family, concierge_family or however the plan field works).

## 2. CONCIERGE PLAN: CLIENT CAN CHANGE REMINDERS AND CHECK-IN TIMES VIA PHONE

In src/app/api/vapi-lookup/route.ts, update the plan gating:

The updatePatientProfile tool (which lets Lily change medicationReminderTime, preferredCallTime, checkInDays) should ONLY be available to CONCIERGE plan clients (and free trial users).

For Essential and Plus clients who ask to change their reminder times or check-in schedule, Lily should say: "Changing your reminder and check-in schedule by phone is available on our Concierge plan for $110 a month. You can also update these settings anytime through your dashboard at kincare360.com. Would you like to hear more about the Concierge plan?"

For Concierge clients: the updatePatientProfile tool stays fully available. Lily confirms the changes and saves them.

In the system prompt, add to the Concierge section:

CHANGE SETTINGS BY PHONE (CONCIERGE PLAN):
Concierge clients can ask you to change their medication reminder times, daily check-in time, and check-in days just by asking during a call. Confirm the new values, then use updatePatientProfile to save. Examples:
- "Change my medication reminder to 9 AM and 9 PM"
- "Move my check-in call to 3 PM"  
- "Only call me on weekdays"

Always confirm before saving: "So your medication reminders will be at 9 AM and 9 PM, is that right?" Then call the tool.

Also in the tools array that gets built in buildAssistantConfig, conditionally include updatePatientProfile ONLY when the patient's plan is concierge or they are on a free trial.

## 3. GIT COMMIT AND PUSH
Commit message: "feat: family plan checkout + Concierge-only phone settings changes"
Push to main.

When completely finished, run this command:
openclaw system event --text "Done: Family plan checkout wired up, change reminders by phone is Concierge-only" --mode now
