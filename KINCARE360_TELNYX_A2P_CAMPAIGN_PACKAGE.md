# KinCare360 Telnyx A2P Campaign Package

Date prepared: 2026-06-06
Provider target: Telnyx A2P 10DLC
Business/legal entity: Son Healthcare Services LLC, operating as KinCare360
Website: https://www.kincare360.com
Support email: hello@kincare360.com
Support phone: (812) 515-5252

## Campaign recommendation

Recommended campaign/use case: Low-volume mixed / customer care / account notifications.

KinCare360 should be positioned as a non-medical family coordination and elder-support service. Avoid medical treatment, diagnosis, emergency response, crisis counseling, medication-compliance, hospital-readmission, or health-monitoring claims.

## Campaign description

KinCare360 sends recurring SMS messages to account owners and family/safety contacts who expressly opt in to receive updates about a loved one. Messages include family check-in notifications, family-approved routine reminder notifications, appointment and everyday coordination updates, account/service messages, family concern notifications, urgent safety concern notices when a caller shares something that may need family follow-up, and daily summaries.

KinCare360 is not a medical provider, emergency response service, crisis counseling service, suicide-prevention service, or in-home care provider. Messages are for non-medical family coordination and account/service support only.

## Message flow / opt-in flow

Account owners may opt in during signup/intake when they provide their phone number and agree to receive KinCare360 SMS messages.

Family members and safety contacts provide their own consent at:

https://www.kincare360.com/family-consent

The Family SMS Consent page asks for the family member's name, mobile phone number, loved one's name, and a required checkbox with this disclosure:

"I agree to receive recurring automated SMS/text messages from KinCare360 about my loved one, including daily check-in summaries, family-approved routine reminders, appointment updates, family concern notifications, and urgent safety concern notices if my loved one shares something that may need immediate family attention. Message frequency varies, up to 5 messages per day. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help. Consent is not a condition of purchase. KinCare360 is not an emergency, crisis, medical, or in-home care service. I have read the Privacy Policy and Terms of Service."

Family members who do not submit the Family SMS Consent form are not enrolled for recurring text updates.

## Opt-in evidence URLs

- Public family consent page: https://www.kincare360.com/family-consent
- Terms of Service SMS section: https://www.kincare360.com/terms
- Privacy Policy SMS section: https://www.kincare360.com/privacy

## HELP response

KinCare360 family updates. Help: hello@kincare360.com or (812) 515-5252. Terms: kincare360.com/terms Privacy: kincare360.com/privacy Reply STOP to opt out.

## STOP response

You have been unsubscribed from KinCare360 text updates. No more messages will be sent. Reply START to resubscribe or visit kincare360.com/family-consent.

## START/UNSTOP response

KinCare360: To receive recurring family text updates, please confirm consent at https://www.kincare360.com/family-consent. Msg & data rates may apply. Reply STOP to opt out.

## Sample SMS messages

1. KinCare360: Lily completed today's family check-in with Maria. Summary: she said she is doing okay and would like a call from family later today. Reply STOP to opt out.

2. KinCare360 routine reminder: Maria asked to be reminded about her 3:00 PM appointment. Please check the family dashboard for details. Reply STOP to opt out.

3. KinCare360 family update: Maria asked for help coordinating transportation for Friday. Please follow up when available. Reply STOP to opt out.

4. Urgent KinCare360 safety concern: Maria shared something that may need immediate family attention. Please check on them now. If there is immediate danger, call 911. KinCare360 is not an emergency response service. Reply STOP to opt out.

5. KinCare360: Your family profile was updated. Visit kincare360.com/login to review family settings. Reply HELP for help or STOP to opt out.

## Embedded links and phone numbers

- Embedded links: Yes, for consent, login, privacy, and terms URLs that are owned by KinCare360.
- Embedded phone numbers: Yes, KinCare360 includes its support phone number in HELP/legal/support messages.

If Telnyx flags embedded links or phone numbers, use samples without links/phone numbers except HELP/STOP responses, and keep links limited to the verified domain kincare360.com.

## Data/privacy statement for reviewer

KinCare360 does not sell, rent, share, or distribute mobile numbers or SMS opt-in data to third parties or affiliates for marketing or promotional purposes. SMS data is used only to provide requested family coordination, account, and service notifications.

## Backend implementation notes

Current code uses Telnyx environment variables:

- TELNYX_API_KEY
- TELNYX_PHONE_NUMBER

Inbound SMS webhook route:

- POST https://www.kincare360.com/api/sms-inbound

The inbound route handles STOP/STOPALL/UNSUBSCRIBE/CANCEL/END/QUIT, START/YES/UNSTOP, HELP/INFO, and generic inbound messages. STOP updates matching family member records to opted out and disables text alerts.

## Review checklist

- Public consent page contains clear opt-in checkbox: yes
- Message frequency disclosed: yes, up to 5/day
- Msg/data rates disclosed: yes
- Consent not condition of purchase: yes
- STOP instructions disclosed: yes
- HELP instructions disclosed: yes
- Terms and Privacy links present: yes
- SMS data sharing/no-sale language present: yes
- Non-medical/emergency limitation present: yes
- Twilio-specific public wording removed from Privacy page: yes
- Active API SMS sender migrated to Telnyx helper: yes
- Build verified after migration: yes, `npm run build` passed

## Submission blocker

This package is ready to submit after:

1. The approved site changes are deployed to https://www.kincare360.com.
2. Telnyx credentials/account access are available in the deployment environment.
3. The Telnyx phone number to use for KinCare360 is selected and configured.
