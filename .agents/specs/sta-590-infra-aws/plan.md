# Plan: `@stackra/infra-aws`

**Spec**: `.agents/specs/sta-590-infra-aws/spec.md`

1. **Config in `.`, programs in `./node`.** A zod schema narrows the parsed root runway to what infra-aws reads (the
   root's provider blocks stay open in `@stackra/runway`); `awsBaselineConfig` and `awsAccounts` turn it into plain
   JSON with `ref:` values intact, failing with runway's `RunwayInvalidError`.
2. **Programs are functions.** Each program groups its resources under one `pulumi.ComponentResource`, builds a
   provider pinned to one account, and composes internal building blocks (`dataKey`, `privateBucket`, `filesBucket`,
   `databaseBackups`, `ciAccess`, `encoreAccess`, `costControls`). No new kind name is needed.
3. **Cross-stack trust by fixed names.** Roles another stack trusts get fixed names (`roleName`), the backup targets
   get fixed names (`backupTargets`), and policies name roles in `aws:PrincipalArn` conditions on the account root, so
   the state, backup and environment stacks apply in any order.
4. **Policies as JSON.** `policyOf` builds each document; no AWS data source is called, so Pulumi's mocks see every
   input. `resolveRef` reads `ref:` values from the stack config.
5. **Tests under mocks.** `./testing` ships `mockPulumi` (records each resource with its inputs, installs the stack
   config) and `outputOf`; every program test asserts the inputs of the resources it creates.
6. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in the other packages.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                  |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/infrastructure/infra-aws`; workspace imports `@stackra/contracts` and `@stackra/runway` only                  |
| Secrets (ADR 0173)                    | PASS   | no secret value is read; `ref:` values are ids and amounts from the stack config; no IAM user or access key                           |
| Security                              | PASS   | OIDC trust pins audience and subject; Encore needs the external id; buckets block public access and refuse plain HTTP; keys rotate    |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                          |
| Tenancy                               | N/A    | no scoped table or query; data at rest stays in its region                                                                            |
| Delegation                            | PASS   | `package-builder` writes the code, `infra-engineer` (route `infra`) owns the programs, `test-engineer` the tests; a separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; the stack is never active-active (ADR 0186)                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the Pulumi packages go to a new `infra` catalog                                                    |
| Deploy modes (ADR 0076)               | PASS   | SaaS only; on-prem and air-gapped do not load it                                                                                      |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE` (ADR 0171 decision 5: the AWS foundation is free)                                                                  |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                               |

## Deploy modes

| Mode       | Behaviour                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------ |
| SaaS       | the stacks repository applies the state, backup and environment programs in Figentra's AWS |
| On-prem    | not used: the customer runs the bundle on its own infrastructure (ADR 0179)                |
| Air-gapped | not used: nothing here is loaded, and the programs would make AWS calls only when applied  |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./node` and `./testing`, and no file under `src/core/` imports `@pulumi/*` — Validates: FR-001
- **P-002**: `awsBaselineConfig` and `awsAccounts` return the template-shaped root's accounts, tags, budgets, backups, files, repository and Encore link, and throw `RunwayInvalidError` naming each missing path and an unquoted account id — Validates: FR-002
- **P-003**: the provider's `allowedAccountIds` is exactly the environment's account and its default tags are the config's tags; the data key rotates — Validates: FR-003
- **P-004**: the files bucket's CORS, lifecycle, public access block, TLS-only policy and replication rule have the stated inputs, and replication is absent without a backup account — Validates: FR-004
- **P-005**: the backup plan has a continuous rule of 14 days and a snapshot rule copying to the backup vault for the retention days; the selection filters by tag only when the account is shared — Validates: FR-005
- **P-006**: the infra role's trust condition is exactly the audience and the environment subject; the OIDC provider exists only in the account's first environment — Validates: FR-006
- **P-007**: the Encore Cloud role trusts Encore's account root with the external id, only in the account's first environment — Validates: FR-007
- **P-008**: the budget alerts at each threshold through a topic restricted to the account, and the stop action targets the infra and Encore roles only outside production — Validates: FR-008
- **P-009**: the state bucket policy denies plain HTTP and other server-side encryption and allows each environment's infra role by condition — Validates: FR-009
- **P-010**: the backup vault and replica bucket have their fixed names, the vault policy allows copy-in and denies early deletion, and environments sharing an account become one user — Validates: FR-010
- **P-011**: `resolveRef` reads plain and structured config keys and fails on a missing path; the program tests run with no engine — Validates: FR-011
