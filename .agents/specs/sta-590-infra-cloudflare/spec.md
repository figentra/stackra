# Feature Specification: `@stackra/infra-cloudflare`, the Cloudflare half of the core Pulumi stack

**Feature Branch**: `figentra/sta-348-complete`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-590

**Linear project**: Figentra OS build

**Clarifications status**: complete

**Input**: Create `@stackra/infra-cloudflare` (infrastructure category, Track R, STA-72) from nothing: Pulumi programs
for the Cloudflare part of the core stack of ADR 0171 decision 6 (zones and DNS, Worker custom domains, the R2
Turborepo cache, the dev tunnels and Access, the WAF and rate limits), with typed config read from the root runway and
unit tests under Pulumi's mocks. Gate C (STA-546) needs the Cloudflare host and certificates from it.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-cloudflare` (new member; the `infrastructure` category folder is
  shared with the other infra-\* builders)
- **Cross-service events**: none
- **Tenancy and data**: none. Tenant custom hostnames are created by the tenancy service at runtime (ADR 0276); this
  stack only sets the Cloudflare for SaaS fallback origin
- **Secrets**: none read or written. Inputs are ids and names; `ref:` values name ids in Pulumi stack config. The
  tunnel token, the Access service-token secrets and the GitHub OAuth client secret are owner steps, never outputs
- **ADR needed**: no (ADR 0171, 0175, 0026, 0217, 0284, 0289, 0290, 0325 decide the scope; ADR 0127 places the
  category)
- **New dependencies**: `@pulumi/pulumi` 3.268.0 (peer and dev) and `@pulumi/cloudflare` 6.22.0, in a new `infra`
  catalog the integrator adds
- **Deploy modes**: SaaS only. On-prem has no Cloudflare edge (ADR 0217 decision 3, ADR 0175 decision 2); the package
  is not part of an on-prem bundle
- **Licence tier**: free (MIT, ADR 0171 decision 5: Cloudflare is free)
- **Docs to update**: `packages/infrastructure/infra-cloudflare/README.md`, `packages/infrastructure/infra-cloudflare/AGENTS.md`
- **Lane**: full (a new package)
- **Change risk**: R3 (infrastructure: DNS, WAF and Access in front of every host; nothing runs until the owner's
  `pulumi up`)

## Clarifications

### Session 2026-10-25

- Where the inputs live: the root runway holds the account, the zones (`providers.cloudflare`) and the `edge` block,
  which its schema leaves open for this package to check. What the runway does not hold yet (the dev zone, zone plans,
  records, Worker domains, buckets, tunnels, Access) is the stack's `infra-cloudflare` config in `figentra/infra`.
- `ref:<key>.<path>` reads the project config key `<key>` and walks `<path>`, the convention `@stackra/infra-aws`
  reads too.
- Plan-dependent edge: Free runs the Free Managed Ruleset, Bot Fight Mode and 10-second rate-limit windows; Pro the
  Cloudflare Managed Ruleset, Super Bot Fight Mode and windows up to a minute. The runway rate is kept when the window
  changes (ADR 0290 decision 13: Free until the first public API).
- The GitHub identity provider is referenced by id, not created, so no client secret passes through code.

## User Scenarios & Testing

### User Story 1 - The owner previews and applies the Cloudflare stack from the runway (Priority: P1)

In `figentra/infra`, `cloudflareCoreStack({ root, stack, ports })` declares every zone the root runway names (imported
by id, protected), its records and Worker domains, the edge on each edge zone, a tunnel per machine, Access and the R2
buckets. The owner reviews the preview and runs `pulumi up`.

**Independent Test**: `src/node/functions/__tests__/cloudflare-core-stack.function.test.ts` and the tests of each part
beside it, under Pulumi's mocks.

**Acceptance Scenarios**:

1. **Given** a root runway with `providers.cloudflare` as `ref:` values and the stack config, **When** the program runs,
   **Then** each zone is imported by its resolved id and only edge zones get the WAF, rate-limit and cache rulesets.
2. **Given** a runway without a Cloudflare account, or a stack zone the runway does not name, **Then** the program
   fails naming the path before any resource is declared.
3. **Given** an unset `ref:`, **Then** the error names the runway path and the `pulumi config set` that fixes it.

### User Story 2 - A developer reaches a dev server through a named tunnel behind Access (Priority: P1)

`stackra dev --tunnel` only runs cloudflared: the stack has made the tunnel, its ingress from the runway dev ports and
the DNS, and Access guards `*.<dev zone>` for the GitHub organisation and the machines' service tokens.

**Independent Test**: `src/core/functions/__tests__/tunnel-ingress.function.test.ts`,
`src/node/functions/__tests__/{dev-tunnel,access-gate}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** member dev ports, **Then** each exposed member gets `<member>-<dev>.<dev zone>` to its local port and the
   catch-all closes the ingress.
2. **Given** a host longer than one DNS label or a member without a port, **Then** the program fails naming the tunnel.
3. **Given** bypass paths and service tokens, **Then** the bypass application covers those paths only, and the guarded
   applications admit the organisation first and the tokens second.

### User Story 3 - The edge follows the runway's edge block (Priority: P2)

**Independent Test**: `src/core/functions/__tests__/{parse-edge,rate-limit-for}.function.test.ts`,
`src/node/functions/__tests__/zone-edge.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's edge block, **Then** it parses as written and keeps `analyticsProxy` for its owner.
2. **Given** `rateLimit.perIp` of 600 per 60 s on a Free zone, **Then** the rule is 100 per 10 s.
3. **Given** `apiHost: api`, **Then** `api.<zone>` is never cached (ADR 0325 rule 24).

## Requirements

- **FR-001**: Entries `.` (isomorphic, no Pulumi import) and `./node` (the Pulumi programs) only; one symbol per entry.
- **FR-002**: `parseEdge` checks the root runway's `edge` block with the ADR defaults (proxy all, managed WAF, TLS 1.2)
  and keeps keys other owners read.
- **FR-003**: `parseCloudflareStack` checks the stack config: hosts under their zone, the dev zone for tunnels and
  Access, record names relative to their zone, no unknown key.
- **FR-004**: Every zone the root runway names is imported by its resolved id and protected; records are named in full
  and proxied by the edge rule only when their type can be; hand-made records and Worker domains are adopted by id.
- **FR-005**: Each edge zone gets the TLS settings, the plan's managed WAF ruleset, the per-IP rate limit in a window the
  plan accepts at the same rate, the cache bypass on the API host and the bot setting of its plan.
- **FR-006**: Each machine gets a named tunnel `<project>-<dev>` with remote ingress from the runway dev ports and a
  proxied CNAME per host; each host is one DNS label on the dev zone.
- **FR-007**: Access guards `*.<dev zone>` and the operator URIs for the GitHub organisation and the service tokens, and
  bypasses only the listed paths.
- **FR-008**: R2 buckets carry an expiry rule when asked; the Turborepo cache expires after 7 days.
- **FR-009**: `ref:` values resolve from the stack config; no input or output is a secret.

## Success Criteria

- **SC-001**: Every public symbol has a test in a `__tests__/` folder beside it; the Pulumi programs are tested under
  mocks with no engine, provider or network.
- **SC-002**: `pnpm verify` green for the member (run in the separate testing workflow).
- **SC-003**: The owner's first `pulumi preview` in `figentra/infra` plans the Cloudflare stack without an input error.

## Out of scope

- The Turborepo cache Worker and the preview router Worker (Worker members deployed by wrangler, ADR 0289).
- Importing the `npm-registry` Worker script, Turnstile widgets, the `docs.figentra.com` redirect and the desktop
  update bucket: listed in the README's "Not built".
- The `tunnels`, `static` and `sandboxHosts` kinds in the runway schema (`@stackra/runway`, ADR 0289 decision 4).

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec written with the package (owner mode: develop now,
  test later)
