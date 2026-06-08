# KinCare360 Telnyx A2P Campaign Package

Date prepared: 2026-06-07
Provider target: Telnyx A2P 10DLC
Business/legal entity: Son Healthcare Services LLC, operating as KinCare360
Website: https://www.kincare360.com
Support email: hello@kincare360.com
Support/SMS phone: +1 272 766 9090

## Campaign recommendation

Recommended campaign/use case: Low-volume mixed / customer care / account notifications.

KinCare360 should be positioned as a non-medical family coordination and elder-support service. Avoid medical treatment, diagnosis, emergency response, crisis counseling, medication-compliance, hospital-readmission, or health-monitoring claims.

## Campaign description

KinCare360 sends recurring SMS messages to account owners, family members, and safety contacts who expressly opt in to receive updates about a loved one. Messages include family check-in notifications, family-approved routine reminder notifications, appointment and everyday coordination updates, account/service messages, family concern notifications, time-sensitive family follow-up notices for non-medical everyday coordination, and daily summaries.

KinCare360 is not a medical provider, emergency response service, crisis counseling service, suicide-prevention service, or in-home care provider. Messages are for non-medical family coordination and account/service support only.

## Message flow / opt-in flow

Family members and safety contacts provide SMS consent at:

https://www.kincare360.com/family-consent

The Family SMS Consent page shows the phone number field and full SMS opt-in language on the same form. The mobile phone number field is optional and labeled: "Mobile phone number (optional; required only if you choose SMS consent)." The SMS checkbox is also optional and labeled "Optional SMS consent." The checkbox disclosure says:

"Optional SMS consent: I agree to receive recurring automated SMS/text messages from KinCare360 about my loved one, including daily check-in summaries, family-approved routine reminders, appointment updates, family concern notifications, and time-sensitive family follow-up notices if my loved one shares a non-medical everyday concern that may need family attention. Message frequency varies, up to 5 messages per day. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help. Consent is not a condition of purchase. KinCare360 is not an emergency, crisis, medical, or in-home care service. I have read the Privacy Policy and Terms of Service."

A family member is enrolled for recurring SMS only when they both provide a valid mobile phone number and choose the optional SMS consent checkbox. If they do not provide a phone number and do not check the box, no SMS consent is recorded and they are not enrolled. If they provide a phone number without choosing SMS consent, the form explains that consent is required to enroll that mobile number for text updates.

Account-owner signup at https://www.kincare360.com/signup does not enroll SMS recipients and is not used as A2P opt-in evidence because the public signup form does not collect a mobile phone number. Signup may show an optional notice that SMS enrollment requires a mobile phone number and separate opt-in consent.

## Opt-in evidence URLs

- Public family consent page showing phone field and full opt-in language: https://www.kincare360.com/family-consent
- Terms of Service SMS section: https://www.kincare360.com/terms
- Privacy Policy SMS section: https://www.kincare360.com/privacy

## HELP response

KinCare360 family updates. Help: hello@kincare360.com or +1 272 766 9090. Terms: kincare360.com/terms Privacy: kincare360.com/privacy Reply STOP to opt out.

## STOP response

You have been unsubscribed from KinCare360 text updates. No more messages will be sent. Reply START to resubscribe or visit kincare360.com/family-consent.

## START/UNSTOP response

KinCare360: To receive recurring family text updates, please confirm consent at https://www.kincare360.com/family-consent. Msg & data rates may apply. Reply STOP to opt out.

## Sample SMS messages

1. KinCare360: Lily completed today's family check-in with Maria. Summary: she said she is doing okay and would like a call from family later today. Reply STOP to opt out.

2. KinCare360 routine reminder: Maria asked to be reminded about her 3:00 PM appointment. Please check the family dashboard for details. Reply STOP to opt out.

3. KinCare360 family update: Maria asked for help coordinating transportation for Friday. Please follow up when available. Reply STOP to opt out.

4. KinCare360 family follow-up: Maria shared a non-medical concern that may need family attention. Please check the family dashboard or follow up when available. KinCare360 is not an emergency or medical service. Reply STOP to opt out.

5. KinCare360: Your family profile was updated. Visit kincare360.com/login to review family settings. Reply HELP for help or STOP to opt out.

## Embedded links and phone numbers

- Embedded links: Yes, for consent, login, privacy, and terms URLs that are owned by KinCare360.
- Embedded phone numbers: Yes, KinCare360 includes its support phone number in HELP/legal/support messages.

If Telnyx flags embedded links or phone numbers, use samples without links/phone numbers except HELP/STOP responses, and keep links limited to the verified domain kincare360.com.

## Data/privacy statement for reviewer

KinCare360 does not sell, rent, share, or distribute mobile phone numbers, SMS opt-in data, or SMS consent records to third parties or affiliates for marketing or promotional purposes. Text messaging originator opt-in data and consent will not be shared with any third parties except service providers that operate the KinCare360 messaging service. SMS data is used only to provide requested family coordination, account, and service notifications.

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
- Peer review status: wording hardened on 2026-06-07 to remove crisis-coded/urgent-safety sample language before submission.

## Submission blocker

This package is ready to submit after:

1. The updated safety/consent wording is deployed to https://www.kincare360.com.
2. Telnyx credentials/account access are available in the deployment environment.
3. The Telnyx phone number `+1 272 766 9090` is connected to the campaign/messaging profile.
