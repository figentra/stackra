---
"@stackra/testing": minor
---

New package: the generic Stackra test kit. Its `.` entry re-exports vitest (a peer dependency) and adds
`freezeClock` and `freezeIds` for deterministic time and ids, the `Fake` base with `Fake.of(Port)` for test doubles,
`createMatcher` with an augmentable `Matchers` interface for custom matchers, and `factory` for plain fixture data.
It depends on no workspace package, so every other package can test through it.
