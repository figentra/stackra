# Plan: `@stackra/infra-gcp`

**Spec**: `.agents/specs/sta-348-infra-gcp/spec.md`

1. **Same shape as infra-aws.** Config in `.` (a zod schema narrows the root runway's open `providers.gcp`;
   `gcpBaselineConfig` returns plain JSON with `ref:` values intact, failing with runway's `RunwayInvalidError`), the
   program in `./node`, Pulumi's mocks in `./testing`.
2. **One program, internal blocks.** `gcpBaseline` groups its resources under one `pulumi.ComponentResource`, builds a
   provider pinned to the project, and composes `dataKey`, `filesBucket`, `ciAccess` and `costControls`.
3. **No data source.** The project number arrives as runway data, so the mocks see every input; `resolveRef` and
   `cloudProjectOf` resolve and check `ref:` values.
4. **Tests under mocks** for every building block and the program; nothing is run in owner mode.

## Constitution Check

| Law                       | Result | Note                                                                                    |
| ------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | `tier:lib`; workspace imports `@stackra/contracts` and `@stackra/runway` only           |
| Secrets (ADR 0173)        | PASS   | no secret value read; no service account key or HMAC key created                        |
| Security                  | PASS   | Workload Identity condition pins the subject; buckets private and on a rotating key     |
| Configuration, not code   | PASS   | region, projects, billing account, currency, amounts and thresholds are runway data     |
| Test placement (ADR 0022) | PASS   | every test in `src/**/__tests__/` beside its subject                                    |
| Versions and catalogs     | PASS   | `catalog:infra` for `@pulumi/gcp` (to be added to the catalog), `workspace:*` otherwise |
| Licence tier (ADR 0077)   | PASS   | MIT (ADR 0354 decision 3)                                                               |
