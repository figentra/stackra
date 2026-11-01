# Implementation Plan: load the database testing tier's faker and PGlite on first use

**Spec**: `spec.md` · **Linear**: STA-1812 · **Branch**: `figentra/sta-1812-lazy-test-peers`

This Mac runs only oxfmt and oxlint; tests run on a box through the testing session.

| Step | What                                                                                       | Gate                   |
| ---- | ------------------------------------------------------------------------------------------ | ---------------------- |
| 1    | `requireTestPeer` loads a peer on first use and names all four when it is missing          | its unit test          |
| 2    | `FAKER` becomes a lazy proxy; `MemoryDatabaseDriver` loads PGlite and the ORM on first use | database testing tests |
| 3    | Test that `#testing/index` imports none of them; README, changeset, scaffold devDeps       | lint, format           |
