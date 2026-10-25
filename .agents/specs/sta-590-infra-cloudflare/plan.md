# Plan: `@stackra/infra-cloudflare`

**Spec**: `.agents/specs/sta-590-infra-cloudflare/spec.md`

1. **Decide in core, declare in node.** `src/core/` holds the zod schemas of the two inputs (the runway `edge` block,
   which the runway schema leaves open for this owner, and the stack config), the planners (`tunnelIngress`,
   `rateLimitFor`, `devPortsOf`), the enums (`ZonePlan`, `WafMode`, `BotMode`) and one error. Everything that can be
   checked without Pulumi is a core function with its own test.
2. **Plain functions, not component classes.** Each `./node` function declares the resources of one part (`cloudflareZone`,
   `zoneEdge`, `devTunnel`, `accessGate`, `r2Bucket`) and returns them, so a stack composes its own or calls
   `cloudflareCoreStack` for all of it and exports the ids it needs.
3. **Inputs.** `providers.cloudflare` gives the account and the zones (name → id or `ref:`); `resolveRef` reads a `ref:`
   from the project config key it names, as `@stackra/infra-aws` does. Zones are imported by id and protected; a
   hand-made record or Worker domain is adopted with `import` (ADR 0290 decision 15).
4. **The edge by plan.** `MANAGED_RULESET_IDS` maps the plan to its managed ruleset; `rateLimitFor` picks the longest
   window the plan allows at or below the runway's and keeps the rate; Bot Fight Mode on Free, Super Bot Fight Mode on
   Pro. The cache bypass rule on `<apiHost>.<zone>` is ADR 0325 rule 24.
5. **Tests under mocks.** A fixture puts Pulumi under `runtime.setMocks`, records each declared resource (type, name,
   inputs, import id) and waits on every returned resource's URN; assertions key resources by name, never by order.
6. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in the other packages.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                         |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/infrastructure/infra-cloudflare`; workspace imports `@stackra/contracts`, `@stackra/runway` (packages only); no app, service, Encore |
| Secrets (ADR 0173)                    | PASS   | ids and names only; a `ref:` names an id; tunnel, service-token and OAuth secrets are owner steps and never outputs                                          |
| Security                              | PASS   | zones protected; Access on every non-production host; the stack config refuses unknown keys and hosts outside their zone                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                 |
| Tenancy                               | N/A    | no tenant data; tenant hostnames are the tenancy service's (ADR 0276)                                                                                        |
| Delegation                            | PASS   | `package-builder` writes the code and tests; the owner runs every `pulumi` command                                                                           |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; Pulumi is decided by ADR 0171                                                                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject; mock helpers in `__tests__/fixtures/`                                                             |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; the Pulumi packages go into a new `infra` catalog (integrator)                                                            |
| Deploy modes (ADR 0076)               | PASS   | SaaS only; on-prem has no Cloudflare edge (ADR 0217 decision 3)                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`; Cloudflare is a free infra package (ADR 0171 decision 5)                                                                                 |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                      |

## Deploy modes

| Mode       | Behaviour                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- |
| SaaS       | the owner runs the core stack in `figentra/infra`; the edge, tunnels and Access sit on Cloudflare |
| On-prem    | not used: the customer's own certificates and no Cloudflare edge (ADR 0175 decision 2, ADR 0217)  |
| Air-gapped | not used: nothing here runs inside an air-gapped install, and the package is not in its bundle    |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` and `./node`, and `.` imports no Pulumi module — Validates: FR-001
- **P-002**: the template's edge block parses as written, an absent block gets proxy all, managed WAF and TLS 1.2, and an unknown bot mode fails at `edge.bots.mode` — Validates: FR-002
- **P-003**: a Worker host or fallback origin outside its zone, tunnels or Access without the dev zone, a bad record name and an unknown key each fail naming their path — Validates: FR-003
- **P-004**: each runway zone is declared with its resolved id as the import id; an A, AAAA or CNAME record is proxied by the edge rule unless it opts out, any other type never — Validates: FR-004
- **P-005**: a Free zone executes ruleset `77454fe2…893ba` and a Pro zone `efb7b8c9…6e9aee`; 600 per 60 s becomes 100 per 10 s on Free and stays on Pro; `api.<zone>` gets `cache: false` — Validates: FR-005
- **P-006**: every ingress host is `<member>-<dev>.<dev zone>` and one DNS label, the list ends with `http_status:404`, and each host has a proxied CNAME to `<tunnel id>.cfargotunnel.com` — Validates: FR-006
- **P-007**: the dev application covers `*.<dev zone>` with the organisation at precedence 1 and the tokens at 2, and the bypass policy sits only on the bypass application — Validates: FR-007
- **P-008**: a bucket with `expireDays: 7` gets one lifecycle rule deleting objects older than 604 800 seconds; one without gets none — Validates: FR-008
- **P-009**: an unset `ref:` fails naming the runway path, and no declared input carries a token or secret — Validates: FR-009
