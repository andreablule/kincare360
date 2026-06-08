# KinCare360 Telnyx A2P Campaign Package

Date prepared: 2026-06-07
Last website-only revision: 2026-06-08
Provider target: Telnyx A2P 10DLC
Business/legal entity: Son Healthcare Services LLC, operating as KinCare360
Website: https://www.kincare360.com
Support email: hello@kincare360.com
Support/SMS phone: +1 272 766 9090

## Campaign recommendation

Recommended campaign/use case: Account Notification.

KinCare360 should be positioned as a non-medical family coordination and elder-support service. Avoid medical treatment, diagnosis, emergency response, crisis counseling, medication-compliance, hospital-readmission, health-monitoring, or broad service-fulfillment claims.

## Brand recommendation

Create/register a separate Telnyx 10DLC Brand parent for KinCare360, while leaving the existing MyShiftReminder Brand/campaign untouched:

- Display name: KinCare360
- Legal company: Son Healthcare Services LLC
- Website: https://www.kincare360.com
- Entity type: Private Profit
- Vertical: Healthcare

## Campaign description

KinCare360, operated by Son Healthcare Services LLC, sends opt-in account notification and family coordination SMS messages to account owners, family members, and designated trusted contacts who have separately consented to receive text messages. Messages may include daily check-in summaries, family-approved routine reminders, family-requested appointment coordination updates, service/account notices, family concern notifications, and time-sensitive non-medical family follow-up notices about a loved one. KinCare360 is not an emergency, medical, crisis, or in-home care service. Messages are non-marketing and are sent only to recipients who opt in.

## Message flow / opt-in flow

Account owners may opt in to receive SMS messages during signup at https://www.kincare360.com/signup. The signup form includes an optional mobile phone number field and a separate optional, unchecked SMS consent checkbox. The checkbox is not required to create an account and is separate from Terms of Service acceptance.

The SMS consent checkbox states that by checking the box, the user agrees to receive recurring automated SMS/text messages from KinCare360, operated by Son Healthcare Services LLC, including account/service notices, daily check-in summaries, family-approved routine reminders, family-requested appointment coordination updates, family concern notifications, and time-sensitive non-medical family follow-up notices. The disclosure states that message frequency varies up to 5 messages per day, message and data rates may apply, reply STOP to opt out, reply HELP for help, and consent is not a condition of purchase. The form also links to the KinCare360 Terms of Service and Privacy Policy.

Family members and designated trusted contacts may separately opt in at https://www.kincare360.com/family-consent. The family consent form includes required fields for full name, loved one's name, and relationship to the loved one. It also includes an optional mobile phone number field and a separate optional, unchecked SMS consent checkbox. The mobile phone number field is optional and is used only if the family member or designated trusted contact wants to receive SMS/text updates. The SMS checkbox is not mandatory.

Consent records are stored with phone number, name, relationship to the loved one, timestamp, consent source, and consent text version where supported by the current form path. Recipients who do not provide a mobile phone number and do not check the SMS consent checkbox are not enrolled for recurring SMS/text updates.

Screenshot evidence of the signup and family consent opt-in forms should be added before provider-side resubmission:

- Signup screenshot: [ADD SIGNUP SCREENSHOT LINK]
- Family consent screenshot: [ADD FAMILY CONSENT SCREENSHOT LINK]

## Opt-in evidence URLs

- Account-owner signup page showing optional phone field and full opt-in language: https://www.kincare360.com/signup
- Public family consent page showing optional phone field and full opt-in language: https://www.kincare360.com/family-consent
- Terms of Service SMS section: https://www.kincare360.com/terms
- Privacy Policy SMS section: https://www.kincare360.com/privacy

## Opt-in auto-response

KinCare360: You are opted in to family coordination texts. Msg frequency varies, up to 5/day. Msg&data rates may apply. Reply HELP for help, STOP to opt out. Privacy: kincare360.com/privacy

## HELP response

KinCare360 family updates. Help: hello@kincare360.com or +1 272 766 9090. Terms: kincare360.com/terms Privacy: kincare360.com/privacy Reply STOP to opt out.

## STOP response

KinCare360: You are opted out and will no longer receive KinCare360 texts. Reply START to opt back in or visit kincare360.com/family-consent for help.

## START/UNSTOP response

KinCare360: To receive recurring family text updates, please confirm consent at https://www.kincare360.com/family-consent. Msg&data rates may apply. Reply STOP to opt out.

## Sample SMS messages

1. KinCare360: Daily check-in summary for Maria: Lily completed today's call and shared no new family concerns. Reply HELP for help. Reply STOP to opt out.

2. KinCare360: Family-approved routine reminder for Robert: evening walk reminder is scheduled for 6:00 PM. Reply HELP for help. Reply STOP to opt out.

3. KinCare360: Family-requested appointment update for Elena: family notes show a visit planned for Tuesday at 10:00 AM. Reply HELP for help. Reply STOP to opt out.

4. KinCare360: Family concern notification for James: he asked for a callback from family after today's check-in. Reply HELP for help. Reply STOP to opt out.

5. KinCare360: Time-sensitive family follow-up for Ana: please follow up directly when available. This is not an emergency service. Reply HELP for help. Reply STOP to opt out.

## Embedded links and phone numbers

- Embedded links: Yes, because HELP/START/STOP and campaign evidence use kincare360.com/privacy, kincare360.com/terms, kincare360.com/family-consent, and other KinCare360-owned URLs.
- Embedded phone numbers: Yes, because the HELP/legal/support messages include +1 272 766 9090.

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

- Public family consent page contains optional phone field and optional unchecked checkbox: yes
- Signup page contains optional phone field and optional unchecked checkbox: yes
- Account creation works without SMS opt-in: yes
- Message frequency disclosed: yes, up to 5/day
- Msg/data rates disclosed: yes
- Consent not condition of purchase: yes
- STOP instructions disclosed: yes
- HELP instructions disclosed: yes
- Terms and Privacy links present: yes
- Footer links to SMS Consent page: yes
- SMS data sharing/no-sale language present: yes
- Non-medical/emergency limitation present: yes
- Twilio-specific public wording removed from Privacy page: yes
- Embedded link setting should be Yes: yes
- Embedded phone number setting should be Yes: yes
- Provider-side Telnyx update status: separate KinCare360 10DLC Brand created on 2026-06-08 with Brand ID `4b20019e-a622-9258-b1cd-48d218a5fd53`, identity `VERIFIED`, and status `OK`. Andrea deactivated the old non-number campaigns in Telnyx. Fresh KinCare360 `ACCOUNT_NOTIFICATION` PASS campaign submitted under this Brand with campaign ID `4b30019e-a63a-0559-84ee-337137722240`; API read-back shows TCR ID `CRKDBDI`, campaign status `TCR_ACCEPTED`, API `status` `ACTIVE`, submission `CREATED`, subscriber HELP/OPTIN/OPTOUT fields all `true`, and no failure reasons. Andrea's Telnyx Console still shows `Pending Telnyx Review`; do not treat the campaign as operationally ready or assign the phone number until Telnyx Console/review status clears. No phone-number campaign assignment has been changed.
