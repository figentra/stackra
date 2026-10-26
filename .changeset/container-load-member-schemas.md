---
"@stackra/container": minor
---

The testing module loads the member's generated schemas once per root on compile (`loadMemberSchemas`, on
`@stackra/container/testing`), as the app boot does, so a test no longer fails with "X has no registered schema".
Testing plugins can add their own compile steps through the extended `TestingPlugin` type.
