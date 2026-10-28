# AGENTS — @stackra/infra-gcp

The free GCP foundation as Pulumi TypeScript (ADR 0354 decision 3, beside `@stackra/infra-aws`). Member at
`packages/infrastructure/infra-gcp` (`tier:lib`). Entries `.` (isomorphic config reader), `./node` (the Pulumi
program) and `./testing` (Pulumi's mocks).

## Where code goes

| You are writing…                   | It goes in…                                          |
| ---------------------------------- | ---------------------------------------------------- |
| A runway reader (no Pulumi import) | `src/core/functions/<name>.function.ts`              |
| A schema or fixed value            | `src/core/constants/<name>.constant.ts`              |
| A Pulumi program or building block | `src/node/functions/<name>.function.ts`              |
| A test helper for consumers        | `src/testing/functions/<name>.function.ts`           |
| A test                             | `__tests__/<name>.<kind>.test.ts` beside its subject |

## Rules

- Never run `pulumi up`, `pulumi destroy`, `stackra runway infra up` or any GCP call. Tests use `mockPulumi`; a real
  check is `stackra runway infra preview`, which the owner reviews.
- `.` stays free of `@pulumi/*`; gen derives the config without loading Pulumi.
- A program is a function that groups its resources under one `pulumi.ComponentResource` and builds its own provider
  pinned to one project and region. Call no GCP data source, so the mocks see every input; anything only GCP knows (the
  project number) arrives as runway data.
- No region, project id, project number, billing account, currency or amount in code: they arrive as runway values or
  `ref:` paths and are resolved from the stack config. Which Figentra region runs on GCP is Figentra's runway, not
  this package. No secret value is read anywhere, and no service account key or HMAC key is created.
- An egress address is `retainOnDelete`: a partner allow-lists it, so a stack change never releases it. Reserve the
  addresses here; attaching them to a Cloud NAT is the network's job.
- The health driver's target is `InfraGcpConfig` (`src/config/infra-gcp.config.ts`, key `infra_gcp`), injected by type:
  the runway's `config.infra_gcp` sets it. Never a constructor options object (gen's `token_not_a_class`).
- Backups are kept 35 days or less, or the runway states `cryptoShredded: true` (ADR 0188 decision 3); the runway
  schema refuses anything else. Never raise the ceiling in code.
- pgaudit is on unless the runway says `pgaudit: false`; its log bucket stays in the server's region. Classes and days
  are runway values (`PGAUDIT_DEFAULTS` only fills what the runway leaves out).
- The slow-statement flags (`log_min_duration_statement`, `auto_explain`) follow `shared.database.slowQueryMs`
  (`SLOW_QUERY_MS` only fills what the runway leaves out, `false` turns them off). All flags go in one
  `databaseFlags` list; never set a second one.

- The shared cache is Memorystore for Valkey reached only through Private Service Connect: never give it a public
  address, never turn transit encryption off, and never add persistence (it is a cache). Node types, shards, replicas,
  eviction and sign-in are runway values; `MEMORYSTORE_NODE_TYPES` lists the node types the runway may name.

## PII

None. The programs hold project ids, resource names and IAM bindings; no person's data, and no address for alerts
(the budget topic is subscribed elsewhere).
