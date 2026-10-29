---
"@stackra/identity": minor
"@stackra/privacy": minor
---

Let a user delete their own account from inside the app (App Store Review Guideline 5.1.1(v), Google Play, STA-1567).
`@stackra/identity/node` adds `DeleteMyAccountAction` (`identity.account_deletion.request@1`, step-up `aal2`, the
caller's own account only), `CancelAccountDeletionAction`, `ShowAccountDeletionQuery`, the hourly system job
`EraseDueAccountsAction` and `AccountDeletionPermissions`. A deletion waits `IdentityConfig.accountDeletionGraceDays`
(30 by default) in the new `AccountDeletions` store (`PostgresAccountDeletionsDriver` over `identity.account_deletions`,
migration `identity.0001`; `MemoryAccountDeletionsDriver`), then the per-scope job queues privacy's `EraseSubjectAction`
unless a legal hold names the subject (a held one is pushed back a day); `SubjectErased` then ends the provider sessions and removes
the provider user. Events `identity.account_deletion.{scheduled,cancelled,started}.v1`. Client halves:
`useAccountDeletion` (`./react`) and `useAccountDeletionSheet` (`./native`, with the device check), with the
`identity.ui.account_deletion` lang keys in seven locales (`./assets/*`). `@stackra/privacy/contracts` adds the
`SubjectHolds` port and `./node` adds its `PostgresSubjectHoldsDriver`. New dependency of identity: `@stackra/database`.
