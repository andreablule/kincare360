# Task: Fix Second Parent Form + Plan Switch Logic

## 1. SECOND PARENT INTAKE FORM - COMPLETE FIELDS

The "Add Second Parent" form is missing fields compared to the first parent intake. It needs to match EXACTLY what the first parent intake has:

Find the AddSecondParentCard component or the /api/patients/add route and the form that adds the second parent. Update it to include:

### Required fields (same as first parent intake):
- First name, Last name
- Date of birth
- Phone number
- Address, City, State, ZIP
- Gender
- Preferred language
- Preferred check-in time
- Medication reminder times
- Check-in days

### Multiple entries (with add/remove buttons):
- Doctors (name, specialty, phone, address) - allow adding MULTIPLE doctors
- Pharmacies (name, phone, address) - allow adding MULTIPLE pharmacies  
- Medications (name, dosage, frequency) - allow adding MULTIPLE medications
- Conditions (name) - allow adding MULTIPLE conditions
- Family members (name, relationship, phone) - allow adding MULTIPLE family members
- Insurance (company, member ID, group number, policy holder)

Each section (doctors, pharmacies, meds, conditions, family members) should have an "Add Another" button and ability to remove entries. Look at how the FIRST parent intake form (src/app/intake/page.tsx) handles these sections and replicate the same UX.

## 2. PLAN SWITCHING - UPGRADE IMMEDIATE, DOWNGRADE END OF CYCLE

### How it should work (Google Fi / industry standard):

**Upgrades (moving to a higher plan):**
- Take effect IMMEDIATELY
- Charge the prorated difference for the remainder of the current billing period
- Use Stripe's subscription update with `proration_behavior: 'create_prorations'`
- Send confirmation email: "Your plan has been upgraded to [Plan Name]. The change is effective immediately. You'll see a prorated charge of $X.XX for the remainder of this billing period."

**Downgrades (moving to a lower plan):**
- Take effect at the END of the current billing period
- User keeps current plan features until then
- Use Stripe's subscription update with `proration_behavior: 'none'` and schedule the change using Stripe's `billing_cycle_anchor` or `cancel_at_period_end` approach
- Actually the best approach: use Stripe subscription schedules or update with `proration_behavior: 'none'` and set the new price to start at period end
- Send confirmation email: "Your plan will change to [Plan Name] at the end of your current billing period on [date]. You'll continue to enjoy [Current Plan] features until then."

**Same tier Individual to Family (or vice versa):**
- Treat as upgrade if going individual -> family (more expensive)
- Treat as downgrade if going family -> individual (less expensive)

### Implementation:

Update the plan switching API route (src/app/api/plan or src/app/dashboard/plan or wherever plan changes happen).

For Stripe subscription updates:
- Get current subscription
- Determine if upgrade or downgrade by comparing price amounts
- Upgrade: `stripe.subscriptions.update(subId, { items: [{ id: itemId, price: newPriceId }], proration_behavior: 'create_prorations' })`
- Downgrade: `stripe.subscriptions.update(subId, { items: [{ id: itemId, price: newPriceId }], proration_behavior: 'none', billing_cycle_anchor: 'unchanged' })` and set a metadata flag or use Stripe's schedule phase to apply the new price at period end

Actually the cleanest approach for downgrade:
```
stripe.subscriptions.update(subId, {
  cancel_at_period_end: false,
  items: [{ id: itemId, price: newPriceId }],
  proration_behavior: 'none',
  // Apply change at end of period using trial_end or schedule
})
```

OR use Stripe Subscription Schedules to schedule the phase change.

The simplest reliable approach:
- Upgrade: update immediately with prorations
- Downgrade: store the pending downgrade in DB (pendingPlan, pendingPlanEffectiveDate = current_period_end), update the subscription at period end via webhook (customer.subscription.updated or invoice.paid)

Update the User model if needed to add: pendingPlan (String?), pendingPlanDate (DateTime?)

### Email notifications:

Send emails for plan changes using the existing Google SMTP setup:
- From: hello@kincare360.com
- App password: rogv owro cfhd sasp
- Use nodemailer

Email templates:
- Upgrade: Subject "Your KinCare360 plan has been upgraded!" - include new plan name, effective immediately, prorated charge amount
- Downgrade: Subject "Your KinCare360 plan change is scheduled" - include new plan name, effective date (end of billing period), note they keep current features until then

### Update the dashboard plan page:
- Show pending downgrade if one exists: "Your plan will change to [Plan] on [date]"
- Allow canceling a pending downgrade
- Show clear upgrade vs downgrade labels on plan options

## 3. GIT COMMIT AND PUSH
Commit: "feat: complete second parent form + smart plan switching with email confirmations"
Push to main.

When completely finished, run this command:
openclaw system event --text "Done: Second parent form complete with all fields, plan switching with immediate upgrades and end-of-cycle downgrades, email confirmations" --mode now
