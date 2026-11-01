---
"@stackra/contracts": minor
---

Add `actorChainOverlaps(a, b)`, the one `onBehalfOf` chain check, and `actorsSharePerson(identity, a, b)`, which also
treats two `usr_` ids of one human as one person (STA-1724, ADR 0509). `IdentityResolver` gains `personOf(usr)`, a
non-abstract method that answers `null` until identity ships a person link; `actorsSharePerson` then falls back to a
verified email or phone match, and lets an identity rejection propagate so callers refuse the vote.

Add `AUDIT_HOT_RETENTION`, ADR 0212's thirteen months of hot audit retention as `Duration.days(397)` (the longest any thirteen
consecutive calendar months can run), which the approval binding prune reads.

Add the `ApprovalSettingsSource` port, the one settings read behind an approval condition's limited reader; `@stackra/settings` ships its driver.
