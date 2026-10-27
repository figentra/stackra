---
"@stackra/loyalty-kit": minor
---

`PartiesLoyaltyMembersDriver` (STA-804): the `LoyaltyMembers` answer over the OS parties service. An OS host subclasses
it with its generated `PartiesClient`; a live person (`parties.person.get@1`) is a member, an unknown, merged-away or
erased one is not, and any other failure throws so a redemption fails closed.
