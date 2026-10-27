<!-- Stackra file contract. Purpose: agent rules for @stackra/infra-cloudflare: where code goes, the Pulumi and secret rules. Boundary: documentation only. Runtime: documentation. Governing contract: ADR 0171 (decision 6); ADR 0453; ADR 0007. -->

# AGENTS — @stackra/infra-cloudflare

The Cloudflare half of the core Pulumi stack (ADR 0171 decision 6): zones and DNS, Worker custom domains, R2 buckets,
dev tunnels, Access, the edge and the OS edge Worker's surroundings (KV, routes, gradual deployment, origin lock;
ADR 0437), read from the root runway; plus the Cloudflare for SaaS and regional-hostname call builders the OS tenancy
service uses. Member at `packages/infrastructure/infra-cloudflare`
(`tier:lib`). Entries `.` (isomorphic checks and planners) and `./node` (the Pulumi programs).

## Where code goes

| You are writing…                           | It goes in…                                 |
| ------------------------------------------ | ------------------------------------------- |
| A zod schema of an input (internal)        | `src/core/constants/<name>.constant.ts`     |
| An enum                                    | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| A pure check or planner (no Pulumi import) | `src/core/functions/<name>.function.ts`     |
| A function that declares Pulumi resources  | `src/node/functions/<name>.function.ts`     |
| A test                                     | `__tests__/<name>.<kind>.test.ts` beside it |
| A Pulumi mock helper                       | `src/node/functions/__tests__/fixtures/`    |
| The Stackra registry Worker's resources    | `src/node/registry/` (ADR 0453)             |
| The Turborepo remote cache's resources     | `src/node/turbo-cache/` (ADR 0026)          |

## Rules

- Never run `pulumi` (preview, up, destroy, import) or call the Cloudflare API: the owner runs the stacks in
  `figentra/infra`. Test a program under Pulumi's mocks (`mockPulumi`, `settled`, `inputsByName`).
- Decide in `src/core/` and declare in `src/node/`: a rule that can be checked without Pulumi is a core function with
  its own test.
- Ids and names only. A tunnel token, a service-token secret or an API token is never an input or an output; a `ref:`
  value names an id, never a secret (ADR 0173).
- A zone is always imported by its runway id and protected; a hand-made record or domain is adopted with `import`.
- A setting whose value Cloudflare leaves untyped (`ZoneSetting.value`) keeps the API's own snake_case keys.
- The Cloudflare plan decides the managed ruleset, the bot setting and the rate-limit windows; keep `rateLimitFor` and
  `MANAGED_RULESET_IDS` in step with Cloudflare's plan table.

- The edge Worker's code and version uploads are wrangler's; `edgeWorker` only moves traffic between uploaded versions
  and never holds a signing-key value (only the slot names from `signingKeySlots`).
- Custom hostnames are created and deleted at run time by OS tenancy through `customHostnameRequest`, never declared in
  the stack; new names stay scope-named (`scopeId`, `scope`), never tenant-named (ADR 0323).
- Regional services are an option per host; never default a market into one.
- The login directory (ADR 0451) is its own Worker and namespace, never the edge Worker's. Its key format is
  `@stackra/identity/contracts`' `loginDirectoryPrefix`, passed in by the host; never spell a `dir:` key here and never
  import `@stackra/identity`. The handler never logs or echoes the identifier and never writes KV; regions write through
  `loginDirectoryKvRequest`.

- The registry Worker (ADR 0453) has its own folder, `src/node/registry/`. Its R2 bucket and D1 database are
  protected (tarballs are immutable, D1 is the only record); its KV namespace is a cache. Its custom domain is declared
  by `registryWorker`, never also under `cloudflareZone`'s `workers`.
- The health driver's target is `InfraCloudflareConfig` (`src/config/infra-cloudflare.config.ts`, key `infra_cloudflare`), injected by type:
  the runway's `config.infra_cloudflare` sets it. Never a constructor options object (gen's `token_not_a_class`).

## PII

None stored. The inputs are zone names, record contents, ids and a GitHub organisation name. The one exception in
transit: `loginDirectoryHandler` reads an email or phone from a request body, hands it to the host's hash and drops it;
it is never logged, echoed or written.
