---
"@stackra/testing": minor
---

New package: the generic Stackra test kit. Its `.` entry re-exports vitest (a peer dependency) and adds
`freezeClock` and `freezeIds` for deterministic time and ids, the `Fake` base with `Fake.of(Port)` for test doubles,
`createMatcher` with an augmentable `Matchers` interface for custom matchers, and `factory` for plain fixture data.
The `./react` and `./native` entries are thin wrappers over Testing Library: `render` and `renderHook` compose a
`providers` list and a `wrapper`, `userEvent` runs one session per render, every render is cleaned up after its test,
and `./native` adds `axe` with the `toHaveNoViolations` matcher. No entry depends on a workspace package, so every
other package can test through it.
