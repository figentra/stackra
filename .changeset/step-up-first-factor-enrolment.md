---
"@stackra/actions": minor
"@stackra/gen": minor
"@stackra/identity": patch
"@stackra/loyalty-kit": minor
---

Step-up for the L3 and L4 user actions STA-2096 raised (STA-340):

- `@stackra/actions`: `stepUp` also takes `{ exempt: "first-factor-enrolment" }`, for which the pipeline asks no
  `StepUpCheck`; the action enforces its own rule.
- `@stackra/gen`: refuses the exemption on any action outside `FIRST_FACTOR_ENROLMENT_ACTIONS`
  (`step_up_exemption_unlisted`).
- `@stackra/identity`: `identity.passkey.confirm` takes the exemption. A first strong factor needs a fresh sign-in;
  once the user has one, a new passkey needs AAL2. Each enrolment is audited with `firstFactor`.
- `@stackra/loyalty-kit`: `points.redeem` and `points.confirm_redemption` need AAL2 from a user. `points.earn_visit` is
  service-only and loses its `POST /loyalty/visits` endpoint: call it from the till or booking service.
