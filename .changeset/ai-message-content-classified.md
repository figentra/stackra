---
"@stackra/ai": patch
---

`Message.content` carries `@Classified(DataClassification.Personal)`, so export, erasure and the logs treat the sealed
prompt and response text as personal data and gen's `encrypted_field_unclassified` check passes (ADR 0465, ADR 0476).
