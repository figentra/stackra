---
"@stackra/database": minor
---

Add `StampSubscriber`, which fills `UserStamps` (`createdBy`, `updatedBy`) from the running call's actor and moves
`Timestamps.updatedAt` on unit-of-work writes; `CrudService.increment` and `repath` stamp their native updates too.
