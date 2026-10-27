<!-- Stackra file contract. Purpose: the README of @stackra/infra-cloudflare: the Cloudflare core stack programs, their inputs and entries. Boundary: documentation only. Runtime: documentation. Governing contract: ADR 0171 (decision 6); ADR 0453; ADR 0007. -->

# @stackra/infra-cloudflare

The Cloudflare half of the core Pulumi stack (ADR 0171 decision 6) as TypeScript programs: the zones and their DNS,
Worker custom domains, the R2 buckets (the Turborepo remote cache), a named dev tunnel per machine, Cloudflare Access
in front of every non-production host and the operator surfaces, and the edge (TLS, the managed WAF, bots, the coarse
per-IP rate limit and the cache bypass on API hosts). It reads the root runway, so no zone id, account or edge rule is
typed twice.

**Tier:** `tier:lib` (`packages/infrastructure/infra-cloudflare`). Entries `.` (isomorphic: the checks and planners)
and `./node` (the Pulumi programs). Depends on `@stackra/contracts`, `@stackra/runway`, zod and `@pulumi/cloudflare`;
`@pulumi/pulumi` is a peer, the stacks repository's own.

Agents never run `pulumi` and never call Cloudflare. The programs run in the private stacks repository
(`figentra/infra`, ADR 0289 decision 9), where the owner runs `pulumi up`; here they are tested under Pulumi's mocks.

## What is here

| Entry    | Symbol                                                                   | Use                                                                              |
| -------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `.`      | `parseEdge(root)`                                                        | the root runway's `edge` block, checked and defaulted                            |
| `.`      | `parseCloudflareStack(document)`                                         | the stack config, checked and defaulted                                          |
| `.`      | `tunnelIngress(tunnel)`                                                  | a tunnel's ingress: `<member>-<dev>.<dev zone>` to each dev port                 |
| `.`      | `devPortsOf(runways)`                                                    | each member runway's `environments.dev.port`                                     |
| `.`      | `rateLimitFor(edge, plan)`                                               | the per-IP rule a plan can hold for the runway's limit                           |
| `.`      | `parseStorefront(settings)`, `shopperLimitRules(policy)`                 | a tenant's campaign settings checked; the per-shopper edge rules                 |
| `.`      | `edgeKvKey(kind, ...parts)`                                              | a key of the edge Worker's KV copy (`host:`, `boot:`, `shell:`, …)               |
| `.`      | `signingKeySlots(keyIds)`                                                | the two active edge-signing keys as secret names; the newest signs               |
| `.`      | `customHostnameRequest(call)`, `customHostnameState(result)`             | the Cloudflare for SaaS calls tenancy makes, and their state                     |
| `.`      | `regionalHostnameRequest(call)`                                          | keep a scope's custom hostname in one region (data localisation)                 |
| `.`      | `loginDirectoryHandler(options)`                                         | the login directory Worker's handler: an identifier to its regions               |
| `.`      | `loginDirectoryKvRequest(call)`                                          | a region's KV bulk put or delete of its directory rows                           |
| `.`      | `CloudflareHealthIndicatorDriver`, `InfraCloudflareConfig`               | the health driver: an edge host answers; its target is `config.infra_cloudflare` |
| `.`      | `ZonePlan`, `WafMode`, `BotMode`, `OriginLock`, `CustomHostnameState`    | enums                                                                            |
| `.`      | `CloudflareConfigInvalidError`                                           | every input failure, with each path                                              |
| `.`      | `EdgePolicy`, `CloudflareStack`, `ZoneOptions`, `TunnelIngressRule`      | types                                                                            |
| `.`      | `EdgeWorker`, `EdgeKvKeyParts`, `SigningKeySlot`, `CloudflareApiRequest` | types                                                                            |
| `./node` | `cloudflareCoreStack({ root, stack, ports })`                            | the whole Cloudflare stack in one call; returns every resource                   |
| `./node` | `cloudflareZone`, `zoneEdge`, `devTunnel`, `accessGate`, `r2Bucket`      | the parts, for a stack that composes its own                                     |
| `./node` | `edgeWorker`                                                             | the OS edge Worker's KV, routes, rollout and locked origins                      |
| `./node` | `loginDirectoryWorker`                                                   | the login directory Worker's global KV namespace and routes                      |
| `./node` | `registryWorker`                                                         | the Stackra registry's R2, D1, KV and custom domain (ADR 0453)                   |
| `./node` | `turboCache`                                                             | the Turborepo remote cache's R2 bucket, expiry and custom domain                 |
| `./node` | `resolveRef(value)`                                                      | a runway value, with `ref:<key>.<path>` read from the stack config               |

## The two inputs

The **root runway** names the account, the zones and the edge (ADR 0175, 0217, 0237):

```yaml
providers:
  cloudflare:
    accountId: ref:cloudflare.accountId
    zones:
      figentra.com: ref:cloudflare.zones.com
      figentra.cloud: ref:cloudflare.zones.cloud
edge:
  proxy: all # A, AAAA and CNAME records are proxied unless they opt out
  waf: managed # the plan's managed ruleset
  bots:
    mode: likely-automated-challenge
  rateLimit:
    perIp:
      requests: 600
      periodSeconds: 60
  tls:
    minVersion: "1.2"
    hsts: true
  apiHost: api # api.<zone> is never cached (ADR 0325 rule 24)
```

The **stack config** (the `infra-cloudflare` key of the stack's `Pulumi.<stack>.yaml`) holds what the runway does not hold
yet. Ids and names only: no token or secret ever sits here.

```yaml
config:
  figentra-infra:infra-cloudflare:
    devZone: figentra.cloud # ADR 0290 decision 1
    zones:
      figentra.com:
        plan: free # ADR 0290 decision 13; pro after the first public API
        fallbackOrigin: cname.figentra.com # Cloudflare for SaaS (ADR 0290 decision 3)
        records:
          docs:
            type: CNAME
            name: docs.stackra
            content: figentra.mintlify.dev
            import: 3f2a… # a hand-made record the stack adopts (ADR 0290 decision 15)
        workers:
          static.stackra.figentra.com:
            service: stackra-static # ADR 0284 decision 9
      figentra.cloud:
        edge: false # dev traffic keeps its own rules (ADR 0290 decision 3)
    buckets:
      turbo-cache:
        expireDays: 7 # matches turbo's cacheMaxAge (ADR 0026)
    tunnels:
      akouta: {} # every member with a dev port
      box:
        members: [console]
    access:
      githubOrganization: figentra
      identityProviderId: ref:cloudflare.access.github
      operatorUris: [api.figentra.com/platform]
      bypass: ["*.figentra.cloud/api/auth/callback"]
      serviceTokens: [box]
```

A zone the runway names and the stack config leaves out gets the defaults: `plan: free`, `edge: true`, no records.

## Using it

```ts
// figentra/infra: cloudflare/index.ts
import * as pulumi from "@pulumi/pulumi";
import { devPortsOf, parseCloudflareStack } from "@stackra/infra-cloudflare";
import { cloudflareCoreStack } from "@stackra/infra-cloudflare/node";
import { readRunway } from "@stackra/runway/node";

const root = readRunway("runway.yaml", "root");
const stack = parseCloudflareStack(
  new pulumi.Config().requireObject("infra-cloudflare"),
  "Pulumi.core.yaml",
);
const ports = devPortsOf({ console: readRunway("apps/console/runway.yaml", "app") });
const cloudflare = cloudflareCoreStack({ root, stack, ports });

export const tunnelIds = Object.fromEntries(
  Object.entries(cloudflare.tunnels).map(([dev, { tunnel }]) => [dev, tunnel.id]),
);
```

`ref:<key>.<path>` reads the project config key `<key>` and walks `<path>` into it, as `@stackra/infra-aws` does:
`ref:cloudflare.zones.com` is `pulumi config set --path cloudflare.zones.com <zone id>`, a key apart from the
`infra-cloudflare` stack config. An unset one fails the program before anything is planned.

## What each part declares

| Part             | Resources                                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudflareZone` | the zone, imported by its runway id and protected; its records (full names, proxied by the edge rule, adopted by id); Worker custom domains; the SaaS fallback origin; regional hostnames |
| `zoneEdge`       | `min_tls_version`, `always_use_https`, HSTS (one year, no subdomains, no preload) when asked; the WAF, rate-limit and cache rulesets; bot management                                      |
| `devTunnel`      | a named tunnel with its ingress held by Cloudflare, and a proxied CNAME per dev host to `<tunnel id>.cfargotunnel.com`                                                                    |
| `accessGate`     | GitHub-organisation, service-token and bypass policies; applications over `*.<dev zone>`, the operator URIs and the bypassed paths; one service token per machine                         |
| `r2Bucket`       | the bucket and, with `expireDays`, a lifecycle rule deleting older objects                                                                                                                |
| `edgeWorker`     | KV namespaces; Worker routes; the gradual deployment; per origin a tunnel (mTLS: authenticated origin pulls on its zone) and an Access app admitting the Worker's token                   |

The edge by plan:

| Plan | Managed WAF                     | Bots                                    | Rate-limit window                                  |
| ---- | ------------------------------- | --------------------------------------- | -------------------------------------------------- |
| free | Cloudflare Free Managed Ruleset | Bot Fight Mode                          | 10 s (the runway's rate kept: 600/60 s → 100/10 s) |
| pro  | Cloudflare Managed Ruleset      | Super Bot Fight Mode, managed challenge | 10 s or 60 s                                       |

## The edge Worker (ADR 0437)

One OS Worker fronts every web host. Its code deploys from CI with wrangler; this stack holds what surrounds it, from
the `edgeWorker` block of the stack config:

```yaml
edgeWorker:
  script: figentra-edge
  namespaces: # default: one `edge` namespace for every key family
    edge: {}
    edge-eu:
      jurisdiction: eu # data localisation for the namespace
  routes:
    figentra.com: ["*.shop.figentra.com/*"]
  rollout: # gradual deployment over versions wrangler uploaded; shares add up to 100
    - version: 8f1c…
      percent: 10
    - version: 2b7a…
      percent: 90
  origins:
    me-central:
      hostname: api-me-central.figentra.com
      lock: tunnel # or mtls (authenticated origin pulls on the hostname's zone)
      service: http://localhost:4000
  signingKeys: [k2026-10, k2026-07] # newest first: the Worker signs with it, the API accepts both
```

- **KV keys** are built by `edgeKvKey` (`host:<hostname>`, `boot:<product>:<surface>:<scope>`, `shell:<surface>:<line>`,
  `release:<product>:<surface>`, `canary:<product>:<surface>`, `wellknown:<hostname>:<file>`); Runway writes platform
  rows, the OS edge projector the rest.
- **Rollout**: the deploy job's health gate moves the shares (steps and threshold are OS settings) and this stack
  applies them; a version missing from `rollout` gets no traffic.
- **Origin lock**: every origin sits behind an Access application that admits only the Worker's service token; a
  tunnel origin has no public ingress, an mTLS origin verifies Cloudflare's client certificate.
- **Signing keys**: `signingKeySlots` names each secret (`STACKRA_EDGE_SIGNING_KEY_<ID>`); rotate by adding a key in
  front and dropping the oldest. The values are the owner's to place.

## Custom domains and regional services (ADR 0276, 0437 decisions 10 and 12)

The OS tenancy service creates and deletes each scope's custom hostname at run time on the zone holding the SaaS
`fallbackOrigin`. `customHostnameRequest` describes each call (create with a TXT-validated DV certificate and the scope
id in custom metadata; get; delete) and `customHostnameState` maps Cloudflare's report onto `pending_ownership`,
`pending_certificate`, `active` or `failed` (tenancy decides `pending_dns` and `removed` itself).

For a regulated market (KSA: NCA, JUR-215), a host can be kept in one Cloudflare region: a platform host through its
zone's `regional` stack config (`api-ksa.figentra.com: <region key>`), a scope's custom hostname through
`regionalHostnameRequest`. Whether a market needs it and which region key is the market pack's launch-gate answer from
counsel and infrastructure; nothing here decides it.

## The login directory Worker (ADR 0451)

The global login directory of ADR 0353 decision 4 is a Worker of its own, not the OS edge Worker. A sign-in page posts
`{ "kind": "email", "value": "…" }` to the directory route; `loginDirectoryHandler` hashes it through the `prefixOf` the
host passes (`@stackra/identity/contracts`' `loginDirectoryPrefix` with the Worker's key), lists the KV keys under the
prefix and answers `{ "regions": [...] }` in the deployment's order, `no-store`. Any method but POST is 405; a body that
is not a small JSON identifier, or does not normalise, is 400.

```ts
import { loginDirectoryPrefix } from "@stackra/identity/contracts";
import { loginDirectoryHandler } from "@stackra/infra-cloudflare";

export default {
  fetch: (request: Request, env: Env) =>
    loginDirectoryHandler({
      kv: env.DIRECTORY,
      regions: env.REGIONS.split(","),
      prefixOf: (id) => loginDirectoryPrefix(id, { id: env.KEY_ID, secret: env.DIRECTORY_KEY }),
    })(request),
};
```

Each region keeps its own rows (`dir:<key id>:<kind>:<hash>:<region>`) with `loginDirectoryKvRequest`: `put` is a bulk
write, `remove` a bulk delete, sent by the region's `LoginDirectoryStore` driver with its own KV-scoped token.
`loginDirectoryWorker` declares the namespace (global, no jurisdiction) and the routes, such as
`login.<product-domain>/directory`.

## Storefront waiting room and per-shopper limits

A storefront's drops and campaigns are tenant settings the storefront exports for the edge stack (ADR 0402); nothing is
typed in code. `parseStorefront` checks them and `cloudflareCoreStack({ …, storefront: { "<zone>": policy } })` puts
them on that edge zone: a waiting room and event per campaign over its window, suspended while `enabled` is false, and
per-shopper rate-limit rules on the hot items after the per-IP rule in the zone's one rate-limit entry point.

```json
{
  "shopper": { "by": "cookie", "name": "shopper_id" },
  "campaigns": {
    "spring-drop": {
      "host": "shop.acme.example",
      "path": "/drops/spring",
      "waitingRoom": {
        "enabled": true,
        "totalActiveUsers": 500,
        "newUsersPerMinute": 200,
        "startsAt": "2026-11-01T09:00:00+03:00",
        "endsAt": "2026-11-01T21:00:00+03:00"
      },
      "limits": [{ "path": "/cart/add/sneaker-1", "requests": 2, "periodSeconds": 60 }]
    }
  }
}
```

## Owner steps

These touch accounts, purchases or secrets, so the owner does them; nothing here does.

- Run `pulumi up` in `figentra/infra` after reviewing the preview (ADR 0171).
- Create the GitHub OAuth app and the Access GitHub identity provider once, and set its id at the `ref:` the stack
  config names. The program references it; its client secret never passes through code.
- Place each tunnel token in Infisical `/agents` and each Access service-token secret where its machine reads it,
  through the secrets inbox (ADR 0257). Neither is a stack output.
- Import a phase entry-point ruleset made by hand before the first `up` on that zone (a zone holds one per phase).
- Move a zone to Pro (a purchase) before setting `plan: pro`.
- Buy the plan that includes waiting rooms and cookie or header rate-limit keys before a storefront uses them.
- Place each edge-signing key value (`STACKRA_EDGE_SIGNING_KEY_<ID>`) in Infisical for the Worker and the API, and the
  Worker's origin service-token secret as a Worker secret; run each origin tunnel's cloudflared with its token.
- Enable Cloudflare for SaaS and, for a regulated market, the regional services and data localisation add-on (a
  purchase) before a `regional` host or `jurisdiction` is set.

## Not built

- The edge Worker itself, the projector and the API's signature check are OS members (`workers/edge`,
  `services/edge-projector`); the automatic rollback on error rate is the deploy job's.
- Per-hostname authenticated origin pulls with an uploaded client certificate: it would put a private key through the
  stack; the zone-level Cloudflare certificate is used.
- The KSA TLS answer (ADR 0437 decision 12): the option is built, the decision is counsel's and infrastructure's.
- The login directory Worker member, its region list and key bindings, and the regions' KV-scoped API tokens are the
  OS's and the owner's; `loginDirectoryWorker` is not part of `cloudflareCoreStack` yet (a stack composes it).
- Tenant handles in the directory (OS-30) are tenancy's; hostnames come from the edge KV `host:` rows.

- The Turborepo cache Worker and the preview router Worker are Worker members deployed by wrangler from CI (ADR 0289
  decisions 1, 2 and 7); this stack holds their bucket and domains only.
- Importing the `npm-registry` Worker script (ADR 0290 decision 15): Pulumi would then own its code, which wrangler
  deploys; an owner decision.
- The `docs.figentra.com` redirect and the Clerk record removal (ADR 0290 decisions 18 and 19) are owner steps; the
  removal is deleting the adopted records from the stack config.
- Turnstile widgets (ADR 0290 decision 10): the forms that use them are not built.
- The desktop update bucket of `targets.electron-release.feed` (ADR 0254) belongs to the desktop release track.
- Tunnels move from the stack config to the root runway's `tunnels` kind (ADR 0289 decision 4) once the runway schema
  carries it.
