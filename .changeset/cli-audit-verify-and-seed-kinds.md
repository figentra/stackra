---
"@stackra/cli": minor
---

Add `stackra audit:verify <bundle.jsonl> [--key <keys.json>]`, the offline check of an audit proof bundle: every link
rehashes to its hash and follows the one before, and every checkpoint is ES256-signed by a trusted key and matches its
link (ADR 0212 decision 3, ADR 0416). Seed packs may now hold `fee-schedule`, `rate-card` and `checklist-template`
records (ADR 0391, RV-22).
