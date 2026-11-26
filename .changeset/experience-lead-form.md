---
"@stackra/experience": minor
---

New landing block `experience.lead_form` (`LeadFormBlock`, `LeadForm`): a request form such as "Book a demo". It
draws a labelled field per `LeadField` (`LeadFieldType`: text, email, phone, textarea), an optional marketing-consent
box that is never ticked by default (`LeadConsent`: the words, the ledger document and its version) and a verification
slot for a challenge widget. It posts one `LeadSubmission` as JSON to `action` (default `LEAD_FORM_ACTION`,
`/api/leads`, the landing's own edge Worker) and announces sent in a status region or failed in an alert that keeps
the answers.
