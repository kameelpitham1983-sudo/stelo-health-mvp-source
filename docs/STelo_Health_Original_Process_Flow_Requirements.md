# STelo Health: Original Process Flow Requirements

## Source material

- Source: the process-flow worksheet supplied in conversation (Client Process, Medical Process, and the two parallel columns for Occupational and Travel medicals).
- The third worksheet of the original workbook has not been imported or reviewed. Nothing in this document is taken from it.
- The source uses the name "Merical" for the service provider. This document uses "STelo Health" as the application name. Confirm the organisation naming before any user-facing text is finalised.

## Two parallel workflows

- **A. Occupational medical workflow:** pre-employment, periodic and transfer medicals.
- **B. Travel medical workflow:** travel medicals. Shares registration, consent, work order and initial medical steps with A, then diverges at referral and specialist steps.

Steps 1 to 17 of the source (identity, consent, registration, work order and case opening) are shared. The two workflows must not be merged after that point.

## Open clarifications (flagged, not changed)

1. **No names at registration.** The source says registration must not capture names or surnames, but step 1 requires identity verification using a User ID or passport, and the employee record and work order need an identifiable person. Clarify how identity is linked to the record without names at registration. Identity and legal implications need review by the client and STelo.
2. **Consent amendments.** Step 5 to 7 (amended consent and video discussion) has no defined rules for what happens if the employee declines after amendment. Requires clarification.
3. **Screening eligibility** (section C) is proposed only and requires confirmation by the clinical lead and Lancet.
4. **Integrations:** Visio (video), Voiso (calls/communication), Health Orbit (provider clinical system), and email delivery are external. None is connected in this application.

## A. Occupational medical workflow (source steps 1 to 32, 36 to 46, 47, 50 to 65)

| # | Requirement | Responsible | STelo module | Status | Development still required | Dependencies |
|---|---|---|---|---|---|---|
| A1 | Verify identity (User ID/passport) | Client HR | Employees | Partial | Capture identity document reference; see clarification 1 | Clarification 1 |
| A2-A4 | Intro video, signed/declined/amended consent, consent returned | Client, Employee | None | Missing | Consent record and status on the employee/case | Video hosting |
| A5-A7 | Consent review, video discussion, employee decision | STelo, Employee | None | Missing | Consent review status and decision record | Visio (external) |
| A8 | Registration: company, employee number, mobile, location, worksite, travel, availability | Employee | Employees, Appointments | Partial | Registration capture screen; respect no-name rule | Clarification 1 |
| A9-A10 | Two-factor authentication and registration confirmation | STelo | Authentication (Supabase) | Unverified | Confirm 2FA is configured; not in this application | Auth configuration (not changed in this pass) |
| A11-A14 | Work order creation, approval link, HR approve/reject | STelo, Client HR | Workflows, Cases | Partial | Work order record and approval decision; email link is external | Email (external) |
| A15-A17 | Record approval, add employee, open case if approved | STelo | Employees, CaseManagement, CaseDetail | Partial | Work-order-to-case link is not confirmed | Database (empty) |
| A18-A19 | Digital membership card generated and published | STelo | Certificates | Partial | Membership card type not confirmed in Certificates | Confirm requirement |
| A20-A23 | Video consultation, medical alert card, infection screen | STelo, Employee | Medicals, Certificates | Missing | Alert card and infection screening fields | Visio (external) |
| A24-A26 | Doctor populates lab forms, quote generated, sent to HR | STelo doctor, HR | GOPs, Documents | Partial | Lab request record and quote approval | Lab integration: none |
| A27-A28 | HR approves or rejects quote; close if rejected | Client HR | GOPs, CaseDetail | Partial | Quote status flow to be verified | Database (empty) |
| A29-A31 | Contact provider; receptionist schedules; notifications | Provider | Appointments, Providers | Partial | Provider scheduling confirmation and notifications | Provider software; email (external) |
| A32-A35 | Attendance, medical in provider system, portal form, notification | Provider | Medicals, Appointments | Partial | Portal completion notification | Health Orbit (external) |
| A36 | AI summary of health questionnaire for clinical review | AI (assist only) | SteloAI | Missing | Summary must not approve or decide | AI provider configuration |
| A37-A38 | Clinician review; select recommendations and fitness outcomes from approved reference sheets | Clinicians | Medicals (clinical review) | Partial | Pre-populated approved sheets not supplied | Reference sheets required |
| A39 | Authorise provider payment per SLA criteria | STelo | GOPs | Partial | SLA criteria not supplied | SLA criteria required |
| A40-A45 | Escalation summary, notifications, client doctor review and saved outcome | Client doctor | CaseDetail, Synopsis | Partial | Escalation status flow | Email (external) |
| A46 | Success/critical intervention summary (AI-assisted, confidential, approved) | AI, STelo | Synopsis | Missing | Confidentiality and approval workflow | Clarification of approval rule |
| A47-A48 | Final fitness outcome, restrictions, recommendations | Clinicians | Medicals, Certificates | Partial | Outcome recording against approved sheets | Reference sheets |
| A50-A52 | Publish outcome pack; notify employee and HR | STelo | Documents, Certificates | Partial | Outcome pack generation; notifications external | Email (external) |
| A53 | Recall reminders | STelo | Appointments | Unverified | Recall scheduling | Database (empty) |
| A54-A65 | Health coaching: enrolment, ten sessions, completion certificate | STelo, Provider | None | Missing | Coaching programme module | Programme definition |

## B. Travel medical workflow (source steps 1 to 17 shared, then travel steps 1 to 16)

| # | Requirement | Responsible | STelo module | Status | Development still required | Dependencies |
|---|---|---|---|---|---|---|
| B1 | Capture travel destination, dates, location, availability | Employee | TravelHealth | Partial | Confirm fields against this requirement | None |
| B2-B3 | Video consultation; medical and travel-health information | STelo | TravelHealth, Medicals | Partial | Travel-health information capture | Visio (external) |
| B4 | Identify specialist referral or further investigation | Clinician | TravelHealth | Missing | Referral decision record; clinician-only | Clinical rules must come from clinicians |
| B5-B7 | Referral letter, specialist quote, HR/Global Mobility approval | STelo, Client | Documents, GOPs | Partial | Referral letter template and quote approval | Documents storage |
| B8-B10 | Specialist booking, uploads, completion records | Specialist | Appointments, Documents | Partial | Specialist completion status | None |
| B11-B16 | Clinical review, payment approval, escalation, outcome pack, recalls, coaching | Clinicians, STelo | As section A | Partial | As section A | As section A |

## C. HPV and colorectal screening (proposed, not implemented)

Status: **Missing** for all steps. Eligibility ages below are proposals only and must not be hard-coded as clinical rules.

| # | Requirement | Responsible | STelo module | Status | Development still required | Dependencies |
|---|---|---|---|---|---|---|
| C1 | Identify screening opportunity | Clinician | Medicals | Missing | Opportunity flag, clinician-confirmed | Clinical lead criteria |
| C2 | Clinician confirms suitability | Clinician | Medicals | Missing | Clinician confirmation record | Clinical lead |
| C3 | Present information; record consent or refusal | Employee | Employees, Documents | Missing | Consent record | None |
| C4 | Separate HPV and colorectal self-collection workflows | STelo | New screening section | Missing | Two workflows | Lancet confirmation |
| C5 | Lab request with STelo/Lancet mnemonic | Clinician | GOPs | Missing | Mnemonic entry | Lancet confirmation |
| C6 | Kit delivery or courier collection | STelo | None | Missing | Logistics record | Courier (external) |
| C7 | Track kit issue, delivery, collection, return | STelo | New screening section | Missing | Status tracking | Lancet |
| C8 | Track processing and outstanding results | STelo | New screening section | Missing | Result status | Lancet |
| C9 | Results to authorised clinician | Clinician | Medicals | Missing | Access rules | Clinical access rules |
| C10 | Clinician-approved recommendations, referrals, follow-up | Clinician | Medicals | Missing | Recommendation record | Clinician approval |
| C11 | Completion and recall | STelo | Appointments | Missing | Recall record | None |

Role access for screening:
- Employee: own screening information, instructions and consent.
- Admin and Coordinator: full screening workflow visibility.
- Provider/Clinician: authorised clinical information and review.
- Employer: operational status only, no screening results.
- Laboratory: information required for processing only.

## Status key

- **Complete:** implemented and verified against live data.
- **Partial:** a screen or data path exists but the full step is not verified.
- **Missing:** no implementation found.
- **Unverified:** cannot be checked until the database is connected and populated.

## Current verification limits

- The connected database is empty and has no migrations applied. Every "Partial" or "Unverified" status depends on that.
- No status is "Complete" in this matrix, because no step has been verified against live data.
