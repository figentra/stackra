# Implementation Plan: a full-history secret scan of every public ref and a stale-branch archive plan

**Spec**: `.agents/specs/sta-2878-history-secret-scan/spec.md` · **Linear**: STA-2878 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2878-history-secret-scan/spec.md`

## Summary

`tools/scripts/secrets-history-scan.mjs` scans a mirror clone of a public repository with the pinned gitleaks over
every commit reachable from any ref, in two passes: the repositorys own policy, and gitleaks default rules with no
allowlist of any kind (no config allowlist, an empty ignore file and `--ignore-gitleaks-allow`). It prints a value-free
Markdown report of each finding and the refs that carry it, lists stale branches, and writes verified bundles and
lease-guarded deletion commands for the owner. Two dated reports under `docs/security/` record the 26 November run.

## Technical Context

- **Language**: JavaScript (ESM), Node 24 (`mise.toml`)
- **Members**: root `tools/scripts` and `package.json` (`secrets:scan:history`); `docs/security`
- **Testing**: `node --test tools/scripts/__tests__/secrets-history-scan.test.mjs`, with a fake gitleaks for the
  value-handling cases and the real gitleaks 8.30.1 for the ref-coverage and inline-allow cases
- **Storage**: none
- **Runtime target**: a developer and CI tool, not shipped

## Key trade-off and research

- **Trade-off: two passes instead of one.** The policy pass answers "would CI block this?"; the raw pass answers "is
  anything token-shaped anywhere in the public history?". Only the raw pass ignores inline `gitleaks:allow` comments,
  because the policy honours them; without that flag a token marked allowed on an unreviewed branch, tag or pull
  request ref would never be seen.
- **Research**: gitleaks 8.30.1 `git --help` (`--log-opts`, `--redact`, `--gitleaks-ignore-path`,
  `--ignore-gitleaks-allow`); GitHub keeps `refs/pull/*/head` public after a branch is deleted; ADR 0009, ADR 0267.

## Applicable standards

| Rule                                       | How it is enforced                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| No secret value in output (ADR 0009, 0267) | check: `assertValueFree` and the "scan refuses, printing nothing" test     |
| Pinned tools (ADR 0019, ADR 0027)          | check: gitleaks version read and printed; `mise.toml` pins 8.30.1          |
| Raw pass ignores inline allow comments     | check: the fake gitleaks exits 9 on the wrong flag; the real-gitleaks test |
| Nothing deleted or pushed by the tool      | check: the archive tests compare every ref before and after                |

## Constitution Check

| Law                                   | Result | Note                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | N/A    | root tool script, no package                                 |
| Secrets (ADR 0009)                    | PASS   | value-free output, checked before printing                   |
| Security                              | PASS   | read-only; deletion is an owner step guarded by a lease      |
| HTTP and events                       | N/A    | none                                                         |
| Tenancy                               | N/A    | none                                                         |
| Not built yet (ADR 0011)              | PASS   | no new technology                                            |
| Test placement (ADR 0022)             | PASS   | `tools/scripts/__tests__/`                                   |
| Versions and catalogs                 | PASS   | no new dependency                                            |
| Deploy modes (ADR 0076)               | N/A    | not shipped                                                  |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                    |
| Docs and ADRs                         | PASS   | two dated reports under `docs/security/`; scripts README row |
