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
| `.`         | `withDeployLock`, `DeployLock`, `RunwayLockedError`                                     | one apply per environment at a time (ADR 0435)                              |
| `.`         | `RunwayProvider`                                                                        | the provider port: plan, apply, verify, rollback and current (ADR 0352 d3)  |
| `.`         | `checkSurfaces(root, apps)`                                                             | surface, mobile and assets failures for `stackra validate` (ADR 0441)       |
| `.`         | `checkDevPorts(root, members)`                                                          | dev port collisions across every indexed repository's lanes (STA-863)       |
| `.`         | `publishExtensionBundles`, `ExtensionBundlePublisher`                                   | publish each surface's extension bundle; ops waits for a reviewer (0436)    |
| `.`         | `edgeRowsOf`, `registerPlatformHosts`, `EdgeStore`                                      | the platform `host:` and app-link `wellknown:` KV rows Runway owns (0437)   |
| `.`         | `mobileBuildRequests`, `buildMobileApps`, `MobileBuilder`                               | the mobile build job, from a product merge or an OS tenant event (0439)     |
| `./node`    | `EncoreCloudProviderDriver`, `EasProviderDriver`                                        | the `encore-cloud` and `eas` providers                                      |
| `./node`    | `EasMobileBuilderDriver`                                                                | the EAS `MobileBuilder`: writes the entry, runs `eas build`                 |
| `./node`    | `CloudflareKvEdgeStoreDriver`, `RegistryBundlePublisherDriver`                          | not wired yet: reject with `RunwayNotConfiguredError`                       |
| `./node`    | `runCommand`, `CommandRunner`                                                           | how a provider runs its CLI, with no shell                                  |
| `.`         | `RunwayKind`, `RunwayEnvironment`, `TopologyMode`, `RequirementEngine`, `CacheEviction` | enums                                                                       |
| `.`         | `SurfaceKind`, `MobileBuildTrigger`, `AppPublisher`                                     | enums of the app-shell sections and the mobile build job                    |
| `.`         | `RunwayInvalidError`, `RunwayUnresolvedError`, `RunwayDeployFailedError`                | errors                                                                      |
| `.`         | `RunwayNotConfiguredError`, `RunwayRefusedError`                                        | a driver with no vendor wired; a release a policy refuses                   |
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

## Surfaces, mobile apps and the assets tree

A product repository has no `apps/` folder by default (ADR 0436): it ships packages, data and assets, and its root
runway names what goes where (ADR 0441 decision 3).

```yaml
product:
  key: mezzora
  edition:
    of: commerce
    version: ^1.0.0
surfaces:
  console:
    shell: os/console@3
    packages: ["@mezzora/console-ui"]
    host: console.mezzora
  landing:
    shell: os/landing@1
    content: assets/landing
    host: mezzora
  ops:
    contributes: "@mezzora/ops-ui"
mobile:
  staff:
    template: os/mobile@3
    packages: ["@mezzora/mobile-ui"]
    assets: assets/mobile/staff
    store: assets/store/staff
    identity:
      name:
        en: Mezzora Staff
      ios:
        bundleId: com.figentra.mezzora.staff
        team: figentra
      android:
        package: com.figentra.mezzora.staff
      links: [console.mezzora.figentra.com]
    capabilities: [scanner, push, printer]
    stores:
      apple:
        account: figentra
      google:
        account: figentra
    eas:
      project: <eas project id>
      channel: production
```

The surfaces are `console`, `landing`, `ops`, `till`, `shopper` and `kiosk`. A surface's `host` is relative to
`environments.<env>.domains.zone`. A product's own app member (an ADR must allow it, 0436 decision 3) is named in the
entry's `app: { member, adr }`. `assets: { root }` is needed only when the tree is not `assets/`. `checkSurfaces` adds
the rules a JSON Schema cannot state: `ops` takes only `contributes` and no other surface does; only `landing` takes
`content`; every other surface names its shell line; every path sits under the assets root; no two surfaces share a
host; an app id ends in `.<product>.<app>`; an `app` names an existing app member.

The Runway steps behind the sections, each over a port:

| Step                                                                | Port                       | Driver                                                |
| ------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------- |
| `publishExtensionBundles(root, sha, publisher, { opsApproved })`    | `ExtensionBundlePublisher` | `RegistryBundlePublisherDriver`: not wired yet        |
| `registerPlatformHosts(root, environment, store, signing)`          | `EdgeStore`                | `CloudflareKvEdgeStoreDriver`: not wired yet          |
| `buildMobileApps(requests, builder, { platformPublishingCleared })` | `MobileBuilder`            | `EasMobileBuilderDriver`: `eas build` in the template |
| `generateBrandSet(root, generator, { screenshots })`                | `BrandGenerator`           | `BrandKitGeneratorDriver`: `brand-kit generate`       |

The ops contribution is published declarations-only and only once a second reviewer approved it; until then it comes
back in `held`. `edgeRowsOf` computes the `host:` rows (product, surface, home region, status, realm, canonical host)
and the `apple-app-site-association` and `assetlinks.json` rows of every linked host, from the Apple team ids and
Android fingerprints the caller passes; nothing is written unless every row resolves. `mobileBuildRequests(root, sha)`
asks for one build per app on a product merge; an OS tenant event's handler builds a white-label request from tenant
data, which `buildMobileApps` parses again and refuses under the platform's store accounts until the Apple 4.2.6 and
4.3 checks are recorded (`RunwayRefusedError`). The EAS builder writes the entry to `.stackra/mobile-app.json` in the
template checkout, where the template's app config and capability plugins read it. A driver with no vendor wired
rejects with `RunwayNotConfiguredError`; bind another driver behind the same port.

The brand step runs in CI before the web and mobile builds that read its output. `brandGenerateRequest(root)` points
the generator at `<assets root>/brand` (the kit) and `<assets root>/store` (the screenshot captions) and writes to
`.stackra/brand`, which is gitignored: the generated set (tokens, HeroUI CSS, app and adaptive icons, splash screens,
favicons and the web manifest, store-screenshot frames) is a build artefact and is never committed (ADR 0441
decision 5). `BrandKitGeneratorDriver` runs the `@stackra/brand-kit` binary, so Runway depends on no brand code; the CI
job installs `@stackra/brand-kit` with the repository (a dev dependency of the product root) and passes the screenshot
job's folder as `screenshots` once that job exists.

## Dev ports across lanes

Lane N adds N × `portStep` to every dev port. With a repository index, every repository's lanes are counted:
lane = index × `worktrees` + worktree.

```yaml
environments:
  dev:
    lanes:
      enabled: true
      portStep: 100
      from: STACKRA_LANE
      worktrees: 10
      repoIndex:
        os: 0
        commerce: 1
```

`checkDevPorts(root, members)` computes every effective port (member ports, dev console, Metro and Electron ports,
each infra container's `port`, `dashboard` and `*Port` fields, the dev proxy) on every lane and reports two owners on
one port, with both lanes, and any port a lane pushes past 65535. Every indexed repository is counted with this
repository's ports, as the template gives each the same layout.

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

One apply runs per environment at a time (ADR 0435): wrap a deploy, promotion, rollback or settings promotion in
`withDeployLock`, which holds `runway:deploy:<project>:<environment>` through your `@stackra/locking` `Locks` and
throws `RunwayLockedError` at once when another apply holds it.

```ts
await withDeployLock(root, "production", locks, () =>
  promote(root, "staging", "production", providers),
);
```

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
