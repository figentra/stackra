# @stackra/runway

Runway format version 3 as code: the schemas of the root runway (WHERE things run and how they are packed) and of the
app and service member runways (WHAT a member needs), the topology placement check, and the readers that generated
tool configs call so no port, origin or feed URL is typed outside a `runway.yaml`.

**Tier:** `tier:lib` (`packages/developer/runway`). Entries `.` and `./node`, plus the asset paths
`./schema/{root,app,service}.json`. Depends on `@stackra/contracts`, `@stackra/validation`, zod and yaml.

## What is here

| Entry       | Symbol                                                                                  | Use                                                                         |
| ----------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.`         | `baseUrlOf(member)`                                                                     | a member's dev origin: the generated Playwright `baseURL`                   |
| `.`         | `devPorts(member)`                                                                      | dev origin, port, host and Electron dev ports: the generated Electron entry |
| `.`         | `updateFeed(member)`                                                                    | the desktop update feed of the build's environment, or `null` in dev        |
| `.`         | `parseRunway(kind, document, source?)`                                                  | check a parsed runway against its version 3 schema                          |
| `.`         | `checkPlacement(root, members)`                                                         | every topology placement failure, for `stackra validate`                    |
| `.`         | `checkRegions(root)`, `regionsOf(root, environment)`                                    | region failures for `stackra validate`; an environment's resolved regions   |
| `.`         | `RunwayCloud`                                                                           | `aws`, `gcp`: the cloud a region names                                      |
| `.`         | `runwayJsonSchema(kind)`                                                                | the zod schemas as JSON Schema, tested against the shipped canonical files  |
| `.`         | `deployTargets(root, environment)`                                                      | every place a release lands, in release order (regions, dedicated tenants)  |
| `.`         | `deploy`, `promote`, `rollback`                                                         | ship, promote and roll back a release through the providers                 |
| `.`         | `RunwayProvider`                                                                        | the provider port: plan, apply, verify, rollback and current (ADR 0352 d3)  |
| `./node`    | `EncoreCloudProviderDriver`, `EasProviderDriver`                                        | the `encore-cloud` and `eas` providers                                      |
| `./node`    | `runCommand`, `CommandRunner`                                                           | how a provider runs its CLI, with no shell                                  |
| `.`         | `RunwayKind`, `RunwayEnvironment`, `TopologyMode`, `RequirementEngine`, `CacheEviction` | enums                                                                       |
| `.`         | `RunwayInvalidError`, `RunwayUnresolvedError`, `RunwayDeployFailedError`                | errors                                                                      |
| `./node`    | `definesFor(member, environment)`                                                       | the bundler `define` map: public vars and the injected runway facts         |
| `./node`    | `devServer(member)`                                                                     | the Vite `server` block from the dev facts                                  |
| `./node`    | `readRunway(file, kind)`                                                                | read, YAML-parse and check one runway file                                  |
| `./schema/` | `root.json`, `app.json`, `service.json`                                                 | `$schema: "@stackra/runway/schema/app.json"` in a runway file               |

The old `./ports` entry is folded into `.` and the old `./vite` entry into `./node` (ADR 0127, 2026-10-24 note).

## The two files

A member runway states what the member needs: `requires` (an engine ADR 0296 lists: `postgres`, `valkey`, `s3` or
`sns-sqs`, and a `reason` when `dedicated`), secret names, `health`, its release block, and per environment its port,
vars, config values and sizes.
It never holds `member`, `deployable`, `isolate`, `group`, `cpu`, `memory` or `instances`; those fail the schema. The
root runway states where members run: providers, destinations, shared pools, defaults and each environment's
`topology`. In a grouped environment every service member sits in exactly one group, or in the `default` group;
`checkPlacement` reports what is not.

```ts
import { checkPlacement } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

const root = readRunway("runway.yaml", "root");
const issues = checkPlacement(root, ["commerce", "notifications"]); // [] when every member is placed
```

## Regions and clouds

The root runway names every data region once, with the cloud and cloud region that serve it, and each environment
lists the regions it deploys to, in release order (ADR 0354 decision 4). Which cloud serves which region is data here,
never a choice in code.

```yaml
providers:
  aws: { accounts: { eu: "ref:aws/eu" } }
  gcp: { projects: { sa: "ref:gcp/sa" } }
regions:
  eu: { cloud: aws, location: eu-central-1, account: "ref:aws/eu" }
  sa: { cloud: gcp, location: me-central2, account: "ref:gcp/sa", jurisdiction: sa }
environments:
  production: { regions: [sa, eu] }
```

A region without a cloud or a location, or a cloud other than `aws` and `gcp`, fails the schema. `checkRegions` reports
a region whose cloud has no `providers` section (`cloud_unconfigured`) and an environment that names an undeclared
region (`unknown_region`); `regionsOf` resolves an environment's regions for the providers. Nothing here deploys.

### The cloud of an environment, KSA in-country and dedicated tenants

Each environment (and each dedicated deployment) names the cloud its foundation runs on and the account or project
that holds it, by key of `providers.aws.accounts` or `providers.gcp.projects` (ADR 0400). This replaces
`providers.gcp.environments`. A dedicated deployment ships the environment's services for one tenant, in its own
project, every time the environment is released.

```yaml
providers:
  gcp: { projects: { ksa: { id: "ref:gcp.ksa.id", number: "ref:gcp.ksa.number" }, firm: { … } } }
regions:
  ksa: { cloud: gcp, location: me-central2, account: "ref:gcp.ksa.id", jurisdiction: sa }
environments:
  production:
    cloud: { name: gcp, account: ksa }
    regions: [ksa]
    destinations: { services: encore-cloud, mobile: eas }
    encore: { branch: main, regions: { ksa: { branch: ksa } } }
    deploy: { on: promote }
    dedicated:
      firm: { tenant: tenant-1, cloud: { name: gcp, account: firm }, encore: { branch: firm } }
```

`checkRegions` also reports a `cloud` whose provider section is missing (`cloud_unconfigured`) or does not hold the
account (`unknown_account`).

## Deploy, promote and roll back

`deployTargets(root, environment)` lists every place a release lands: each kind of member in build order, in each
region in release order, then each dedicated tenant's services. `deploy` applies and verifies each target through its
provider and stops at the first one that is down; `promote` ships what the source environment runs to an environment
with `deploy.on: promote`; `rollback` returns each target to its record from an earlier release (the caller reads the
records from the release log, ADR 0352 decision 7).

```ts
import { promote } from "@stackra/runway";
import { EasProviderDriver, EncoreCloudProviderDriver, readRunway } from "@stackra/runway/node";

const root = readRunway("runway.yaml", "root");
const providers = [
  new EncoreCloudProviderDriver({ app: "acme" }),
  new EasProviderDriver({ projectDir: "apps/mobile" }),
];
const results = await promote(root, "staging", "production", providers); // one record per target
```

| Provider       | apply                                                                     | verify                      | rollback                      |
| -------------- | ------------------------------------------------------------------------- | --------------------------- | ----------------------------- |
| `encore-cloud` | `git push encore://<app> <sha>:refs/heads/<branch>` (`encore.branch`)     | the branch holds the commit | force-push the earlier commit |
| `eas`          | `eas build --profile <channel>` or `eas update --channel` (`targets.eas`) | build status, or the group  | republish the earlier group   |

A store build cannot be rolled back; the EAS provider refuses it. Helm and Zarf output for on-prem waits for the first
prospect (ADR 0400).

## Runway facts

The readers answer from resolved facts, never from the YAML. `stackra dev` writes them for every member as
`.stackra/dev/ports.json` at the repository root (lane offsets applied); the readers find the file by walking up from
the working directory. A bundle built with `define: definesFor(member, environment)` carries its member's facts as
`__STACKRA_RUNWAY__`, which wins over any file, so a packaged Electron app reads its feed without touching disk.

```ts
// .stackra/vite.config.ts (generated)
server: devServer("console"),
define: definesFor("console", process.env.STACKRA_ENVIRONMENT ?? "dev"),

// .stackra/entry/electron.ts (generated)
const dev = electron.isPackaged ? null : devPorts("console");
updateFeed("console"); // <feed.publicOrigin>/<release.desktop.feedPath>/<channel>/
```

`definesFor` inlines only `VITE_`, `EXPO_PUBLIC_` and `RENDERER_VITE_` vars. A `ref:` or `${pr}` value is read from
the build environment under the same name (runway syncs it there) and fails the build when unset; `from-port` and
`from-member` resolve from the dev facts, in dev only.

## Changing a schema

The canonical schemas are `tools/schemas/runway-<kind>.schema.json` at the repository root (the static Worker serves
them, ADR 0284). `schema/<kind>.json` is a byte copy of each, and `pnpm validate` fails until you `cp` the canonical
file over it. The zod in `src/core/constants/` must accept and refuse the same documents (plus the cross-field rules
JSON Schema cannot state), and the `runwayJsonSchema` test compares its derivation with the shipped file once both are
normalised, so a canonical change lands with the matching zod change. ADR 0400 keeps `tools/schemas` the source of
truth and the package copy the byte copy.
