---
"@stackra/segments": minor
---

Add `@stackra/segments`: named audiences over any subject model, dynamic (a `@stackra/rules` rule set) or manual, with
membership materialised per segment and subject, recomputed on the subject's row changes through the outbox, hourly per
scope and on a newly published revision, `MembershipEntered` and `MembershipLeft` integration events for every change,
and `SegmentMembershipService` for the consumers that read it.
