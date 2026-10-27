---
"@stackra/rules": minor
---

Add the `FactProvider` port, `factsFrom(providers, subject)` and the `FactSubject` type: an add-on supplies a fact
source's facts for a subject (segment membership), so a business rule can target a segment without the engine or IAM
depending on the add-on (ADR 0462 decision 1).
