# Plan: `@stackra/infra-identity`

**Spec**: `.agents/specs/sta-590-infra-identity/spec.md`

1. **Member files** copy `@stackra/runway`'s shape: `package.json` (entries `.` and `./node`, `#core` and `#node`
   imports), the `decorators` TypeScript and Vitest presets (the runway source reaches `@stackra/validation`), the
   tsdown entries, `stackra.config.ts` with `definePackage({})`, README, AGENTS, LICENSE and the CHANGELOG stub.
2. **The seed** (`src/core/constants/identity-seed-schema.constant.ts`) is one strict zod schema with its cross-field
   rules; `parseIdentitySeed` turns its issues into `RunwayIssue`s, and `readIdentitySeed` (`./node`) reads the YAML
   the way `readRunway` does.
3. **The plan** (`src/core/functions/identity-plan.function.ts`) is one pure function: it checks `providers.zitadel`
   with its own schema (the root schema keeps provider blocks open), picks the instance, and gathers each app's
   callbacks for the environments it serves, checking each against the app's kind and the instance's environments.
4. **The Pulumi slice** (`src/node/functions/identity-stack.function.ts`) is one function over `@pulumiverse/zitadel`:
   an explicit provider on the plan's domain, the instance policies, the organisation and its sign-in policy, the
   project, roles, clients and machine users, and the outputs. No component resource: the slice is one stack.
5. **Tests**: the seed and plan over documents shaped like the template's apps (the root runway through
   `parseRunway`), the reader over temporary files, and the slice under `runtime.setMocks` and `runtime.setAllConfig`.

## Constitution Check

| Law                                   | Result | Note                                                                                                                      |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/infrastructure/infra-identity`; workspace imports `@stackra/contracts` and `@stackra/runway` only |
| Secrets (ADR 0173)                    | PASS   | no client secret exists; the provider key is stack config the owner sets; outputs are ids                                 |
| Security                              | PASS   | MFA forced and sign-up off for staff, short-lived JWT access tokens, exact callbacks, `https://` only on production       |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                              |
| Tenancy                               | N/A    | no tenant data; tenant organisations are the identity service's                                                           |
| Delegation                            | PASS   | `package-builder` writes the code and the tests; a separate reviewer and the testing workflow run them                    |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; Pulumi is decided by ADR 0171 and ZITADEL by ADR 0206                                 |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                 |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the Pulumi packages go into the `infra` catalog                                        |
| Deploy modes (ADR 0076)               | PASS   | an infra-time library, identical in SaaS, on-prem and air-gapped                                                          |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; free per ADR 0171 decision 5                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                   |

## Deploy modes

| Mode       | Behaviour                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------- |
| SaaS       | one stack per ZITADEL Cloud instance, run inside the generated Pulumi program                       |
| On-prem    | identical against the customer's self-hosted ZITADEL, named as an instance in the root runway       |
| Air-gapped | identical code; the seed and runway are local files and the provider reaches only the local ZITADEL |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./node`; `.` exports `identityPlan`, `parseIdentitySeed`, `IdentityAppKind`, `InstanceRole` and `IdentityInfraInvalidError` and imports no Pulumi; `./node` exports `identityStack` and `readIdentitySeed` only — Validates: FR-001
- **P-002**: a minimal seed gets every default; an unknown key, another version, a bad role code or colour, a duplicate or undeclared role, and the device code or token exchange on a BFF are refused with their paths — Validates: FR-002
- **P-003**: the non-production instance holds the dev, preview and staging callbacks and the production instance only production's; an app with no callback and no device code is left off — Validates: FR-003
- **P-004**: a pattern, a relative URI, a fragment, a BFF custom scheme, an `http://` BFF callback on production and a native `http://` callback off loopback are refused; a BFF `http://` callback elsewhere turns on dev mode — Validates: FR-004
- **P-005**: under Pulumi mocks the slice registers the provider on the plan's domain, the instance policies, the staff organisation and login policy, the project, roles, one PKCE client per app with its grants, and each machine user with its roles — Validates: FR-005
- **P-006**: the outputs carry the issuer, the organisation and project ids, every client id, every machine user id and the first-party list — Validates: FR-006
- **P-007**: no client has a secret, the provider key is read only from the stack config, and an unset key fails naming it — Validates: FR-007
