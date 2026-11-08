---
"@stackra/gen": minor
---

A query may keep a permission above L1 when it says why: a `// reason: …` above or trailing its `permission`
(or its `key`, for a derived permission) lets `query_above_l1` pass, and the manifest records it as `riskReason`.
Without a reason the query is still refused. For deliberate floors that strict gen must not lower: an audit
export, reads that return credentials, raw provider payloads, hashed personal data.
