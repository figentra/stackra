# Feature Specification: `@stackra/infra-identity`, ZITADEL per environment

**Feature Branch**: `figentra/sta-348-complete`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-590

**Linear project**: Figentra OS build (Track R: STA-72; gate C: STA-546)

**Clarifications status**: complete

**Input**: Build `@stackra/infra-identity` (infrastructure category, ADR 0127 and 0171 decision 2): the ZITADEL setup of
each environment (ADR 0206): the staff organisation, the project and its roles, one OIDC client per app, the machine
users and the branding, described by the seed `.stackra/zitadel/seed.yaml`, for the Pulumi program `stackra infra gen`
composes.

## Impact

- **Apps touched**: none (each app's identity config feeds the seed through gen; nothing here changes an app)
- **Services touched**: none (the identity service's runtime work over ZITADEL stays in that service)
- **Packages touched**: `packages/infrastructure/infra-identity` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none. Tenant organisations are created at runtime by the identity service, not by this stack
- **Secrets**: none in git or in the stack's outputs. Every client is code with PKCE and no client secret; the
  provider's signing key is a secret value in the stacks repository's stack config (`zitadel:jwtProfileJson`) that the
  owner sets; machine keys are created by the owner outside the stack (ADR 0173)
- **ADR needed**: no (ADR 0171 decisions 2 to 5, ADR 0206, ADR 0207, ADR 0268 R3, ADR 0274, ADR 0277, ADR 0290
  decision 8, ADR 0296 decision 2)
- **New dependencies**: `@pulumi/pulumi` and `@pulumiverse/zitadel` 0.2.0 (Apache-2.0) in the `infra` catalog
- **Deploy modes**: same in all; a build-time and infra-time library, never in a runtime
- **Licence tier**: free (MIT; ADR 0171 decision 5 keeps identity out of the Pro runtime stack)
- **Docs to update**: `packages/infrastructure/infra-identity/README.md`,
  `packages/infrastructure/infra-identity/AGENTS.md`
- **Lane**: full (a new package)
- **Change risk**: R3 (identity configuration: sign-in policy, token lifetimes and OIDC clients)

## Clarifications

### Session 2026-10-25

- Where the instances are named: the root runway's `providers.zitadel.instances`, each with its domain and the runway
  environments it serves. An identity provider account is a vendor account, a root fact (ADR 0296 decision 2); the
  root runway schema keeps provider blocks open, so this package checks its own block.
- One Pulumi stack per ZITADEL instance, not per runway environment: the non-production instance serves dev builds,
  preview and staging, and the production instance serves production (ADR 0290 decision 8, and the template's
  `ref:identity.clients.<app>.nonprod` and `.prod` values).
- Every client is the authorization code with PKCE and no secret, the web BFF included (ADR 0206 decision 8), so the
  stack creates no secret value. JWT access tokens last ten minutes and refresh tokens 30 days (ADR 0206 decision 8,
  ADR 0277 decision 4).
- The staff organisation forces a second factor, refuses self-registration and checks again every twelve hours
  (ADR 0207 decision 3). The twelve-hour cap on staff refresh tokens is not a per-organisation setting in ZITADEL and is
  left to the identity service.
- Branding is ZITADEL's own label policy on the instance (ADR 0268 R3); a tenant's organisation shows its own policy,
  which the identity service writes.
- The seed's dev users seed only the local dev container (ADR 0199 decision 3); no hosted instance gets them.
- ZITADEL matches callbacks exactly, so a pull request's preview callback is registered by the preview job, and the
  seed refuses a `${pr}` pattern.

## User Scenarios & Testing

### User Story 1 - `stackra infra gen` plans one ZITADEL instance (Priority: P1)

The CLI reads the root runway and the seed and asks for the plan of one instance; it gets the domain, the issuer, the
environments served, the organisation, the project, the apps with the callbacks of those environments, the machine
users and the branding, or every failure at once.

**Independent Test**: `src/core/functions/__tests__/{parse-identity-seed,identity-plan}.function.test.ts`,
`src/node/functions/__tests__/read-identity-seed.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a root runway with a non-production and a production instance and a seed with a BFF, a mobile app and a
   CLI, **When** the non-production instance is planned, **Then** it holds the dev, preview and staging callbacks, the
   BFF's `http://` dev callback turns on dev mode, and the CLI is there for its device code.
2. **Given** the same inputs, **When** the production instance is planned, **Then** it holds only production's
   callbacks, with no dev mode.
3. **Given** no `providers.zitadel`, an invalid block, an unknown instance, or a callback the instance cannot hold,
   **Then** one `IdentityInfraInvalidError` names every path.
4. **Given** a seed with an unknown key, another version, a role declared twice or held but not declared, a bad role
   code or colour, or the device code on a BFF, **Then** `parseIdentitySeed` names every path.

### User Story 2 - `pulumi preview` shows the instance's resources (Priority: P1)

Inside the generated program, `identityStack(plan)` creates the instance's policies, the staff organisation, the
project, its roles, the clients and the machine users, and exports the ids the runways' `ref:` values name.

**Independent Test**: `src/node/functions/__tests__/identity-stack.function.test.ts` (Pulumi mocks).

**Acceptance Scenarios**:

1. **Then** the provider points at the plan's domain and reads its key from the stack config; an unset key fails
   naming it.
2. **Then** each app gets one client with code and PKCE, no secret, JWT access tokens and role assertion, plus the
   device-code or token-exchange grant it asks for.
3. **Then** each machine user gets its instance roles and project roles, and the outputs carry every client id, every
   machine user id and the first-party client list.

## Requirements

- **FR-001**: Entries `.` (isomorphic, no Pulumi import) and `./node` (the seed reader and the Pulumi slice); one
  symbol per entry.
- **FR-002**: `parseIdentitySeed(document, source?)` checks seed format version 1 strictly: snake_case role codes,
  `#rrggbb` colours, a role declared once, every role a machine or dev user holds declared, and the device code and
  token exchange on native apps only; `readIdentitySeed(file)` reads and checks a seed file.
- **FR-003**: `identityPlan(root, seed, instance)` reads `providers.zitadel.instances.<instance>` (domain and
  environments) and gathers each app's callbacks for those environments, de-duplicated, in environment order; an app
  with no callback there and no device code is left off the instance.
- **FR-004**: A callback is absolute, has no fragment and no `${…}` pattern; a BFF calls back on `https://`, or on
  `http://` in dev mode on an instance that serves no production; a native app on a custom scheme, `https://` or a
  loopback `http://` address.
- **FR-005**: `identityStack(plan)` sets the instance's token lifetimes (ten-minute access and id tokens, 30-day
  refresh tokens), the 12-character password rule with no composition rules, and the branding when the seed has one;
  creates the staff organisation with a forced second factor, no self-registration and twelve-hour checks, the project
  with role assertion, its roles, one code-and-PKCE client per app with no secret, and the machine users with their
  instance and project roles.
- **FR-006**: The slice exports the issuer, the organisation and project ids, the client id of every app, the user id
  of every machine user and the first-party client list.
- **FR-007**: No secret value is read, written or exported by this package's code; nothing calls a cloud outside the
  Pulumi engine, and agents run `pulumi preview` at most.

## Success Criteria

- **SC-001**: A seed shaped like the template's apps gives a plan for each instance; every refusal names its path.
- **SC-002**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-003**: `pnpm verify` green for the member (run in the separate testing workflow).

## Out of scope

- Writing `.stackra/zitadel/seed.yaml` from the apps' identity configs, the role catalogue and the brand, and composing
  this slice into `.stackra/infra/` (gen).
- Seeding the local dev container from the seed, and the `stackra infra gen/preview` command (cli).
- Registering and removing a pull request's preview callback (runway's preview job).
- Tenant organisations, their grants and label policies, the claims action, machine identities for API keys and the
  staff refresh-token cap (the identity service).
- The ZITADEL Cloud instance and its custom domain, the provisioner and machine keys, external sign-in providers and
  logo uploads: owner steps.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · new package built in owner mode (develop now, test later)
