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

| Entry    | Symbol                                                              | Use                                                                |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.`      | `parseEdge(root)`                                                   | the root runway's `edge` block, checked and defaulted              |
| `.`      | `parseCloudflareStack(document)`                                    | the stack config, checked and defaulted                            |
| `.`      | `tunnelIngress(tunnel)`                                             | a tunnel's ingress: `<member>-<dev>.<dev zone>` to each dev port   |
| `.`      | `devPortsOf(runways)`                                               | each member runway's `environments.dev.port`                       |
| `.`      | `rateLimitFor(edge, plan)`                                          | the per-IP rule a plan can hold for the runway's limit             |
| `.`      | `ZonePlan`, `WafMode`, `BotMode`                                    | enums                                                              |
| `.`      | `CloudflareConfigInvalidError`                                      | every input failure, with each path                                |
| `.`      | `EdgePolicy`, `CloudflareStack`, `ZoneOptions`, `TunnelIngressRule` | types                                                              |
| `./node` | `cloudflareCoreStack({ root, stack, ports })`                       | the whole Cloudflare stack in one call; returns every resource     |
| `./node` | `cloudflareZone`, `zoneEdge`, `devTunnel`, `accessGate`, `r2Bucket` | the parts, for a stack that composes its own                       |
| `./node` | `resolveRef(value)`                                                 | a runway value, with `ref:<key>.<path>` read from the stack config |

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

| Part             | Resources                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudflareZone` | the zone, imported by its runway id and protected; its records (full names, proxied by the edge rule, adopted by id); Worker custom domains; the SaaS fallback origin |
| `zoneEdge`       | `min_tls_version`, `always_use_https`, HSTS (one year, no subdomains, no preload) when asked; the WAF, rate-limit and cache rulesets; bot management                  |
| `devTunnel`      | a named tunnel with its ingress held by Cloudflare, and a proxied CNAME per dev host to `<tunnel id>.cfargotunnel.com`                                                |
| `accessGate`     | GitHub-organisation, service-token and bypass policies; applications over `*.<dev zone>`, the operator URIs and the bypassed paths; one service token per machine     |
| `r2Bucket`       | the bucket and, with `expireDays`, a lifecycle rule deleting older objects                                                                                            |

The edge by plan:

| Plan | Managed WAF                     | Bots                                    | Rate-limit window                                  |
| ---- | ------------------------------- | --------------------------------------- | -------------------------------------------------- |
| free | Cloudflare Free Managed Ruleset | Bot Fight Mode                          | 10 s (the runway's rate kept: 600/60 s → 100/10 s) |
| pro  | Cloudflare Managed Ruleset      | Super Bot Fight Mode, managed challenge | 10 s or 60 s                                       |

## Owner steps

These touch accounts, purchases or secrets, so the owner does them; nothing here does.

- Run `pulumi up` in `figentra/infra` after reviewing the preview (ADR 0171).
- Create the GitHub OAuth app and the Access GitHub identity provider once, and set its id at the `ref:` the stack
  config names. The program references it; its client secret never passes through code.
- Place each tunnel token in Infisical `/agents` and each Access service-token secret where its machine reads it,
  through the secrets inbox (ADR 0257). Neither is a stack output.
- Import a phase entry-point ruleset made by hand before the first `up` on that zone (a zone holds one per phase).
- Move a zone to Pro (a purchase) before setting `plan: pro`.

## Not built

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
