---
"@stackra/cli": minor
---

`stackra validate --repository` now checks the tests that do not always run (ADR 0182 decision 4, the flaky-test
quarantine). Every `skip`, `todo`, `fixme`, `fails`, `skipIf` and `runIf` marker (and `xit`, `xdescribe` and node:test's
`{ skip }` / `{ todo }` options) must be listed in `tools/scripts/test-markers.yaml`: an environment gate under `gates`
with its reason, a flaky or broken test under `quarantine` with its Linear issue, reason and an `until` date at most 30
days out. An unlisted marker, an ended or too-long quarantine, a listed entry no marker matches and a committed `.only`
are findings.

The same command applies the shared-box rules to every test file: binding a literal port, a fixed `*_PORT` constant,
and a write to a fixed `/tmp` path, a fixed name under `tmpdir()` or the real home folder are findings. A deliberate
exception carries `// shared-box: <reason>` on the line or the line above. A repository without the list file has no
gates and no quarantine, so its markers are findings until they are listed.
