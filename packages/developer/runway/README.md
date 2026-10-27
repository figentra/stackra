# @stackra/runway

<!--
Stackra file contract:
Purpose: the package's reader guide: runway format version 3, the topology placement check, deploy, the runway facts
         readers, and how integration events fan out between the services a topology places.
Boundary: documentation only; the event topics and subscriptions are gen's output, not this package's.
Runtime: none
Governing contract: ADR 0296; ADR 0352; ADR 0400; ADR 0444 (the tools stack block); ADR 0148 (decisions 3 and 6);
                    ADR 0260 (decision 4); ADR 0441 (decision 3: surfaces, mobile); ADR 0439 (the mobile job); ADR 0436;
                    ADR 0441 as amended (D17 the brand step, D19 the capture job); STA-863 (lanes); ADR 0453
                    (decision 6: `providers.npm.registry`).
-->

Runway format version 3 as code: the schemas of the root runway (WHERE things run and how they are packed) and of the
app and service member runways (WHAT a member needs), the topology placement check, and the readers that generated
tool configs call so no port, origin or feed URL is typed outside a `runway.yaml`.

**Tier:** `tier:lib` (`packages/developer/runway`). Entries `.` and `./node`, plus the asset paths
`./schema/{root,app,service}.json`. Depends on `@stackra/contracts`, `@stackra/validation`, zod and yaml.

## What is here

| Entry       | Symbol                                                                                                            | Use                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `.`         | `baseUrlOf(member)`                                                                                               | a member's dev origin: the generated Playwright `baseURL`                                              |
| `.`         | `devPorts(member)`                                                                                                | dev origin, port, host and Electron dev ports: the generated Electron entry                            |
| `.`         | `updateFeed(member)`                                                                                              | the desktop update feed of the build's environment, or `null` in dev                                   |
| `.`         | `parseRunway(kind, document, source?)`                                                                            | check a parsed runway against its version 3 schema                                                     |
| `.`         | `checkPlacement(root, members)`                                                                                   | every topology placement failure, for `stackra validate`                                               |
| `.`         | `checkRegions(root)`, `regionsOf(root, environment)`                                                              | region failures for `stackra validate`; an environment's resolved regions                              |
| `.`         | `checkPorts(root, members)`, `PortIssue`                                                                          | every duplicate effective dev port across the repository lanes, both owners                            |
| `.`         | `RunwayCloud`                                                                                                     | `aws`, `gcp`: the cloud a region names                                                                 |
| `.`         | `runwayJsonSchema(kind)`                                                                                          | the zod schemas as JSON Schema, tested against the shipped canonical files                             |
| `.`         | `deployTargets(root, environment)`                                                                                | every place a release lands, in release order (regions, dedicated tenants)                             |
| `.`         | `deploy`, `promote`, `rollback`                                                                                   | ship, promote and roll back a release through the providers                                            |
| `.`         | `withDeployLock`, `DeployLock`, `RunwayLockedError`                                                               | one apply per environment at a time (ADR 0435)                                                         |
| `.`         | `RunwayProvider`                                                                                                  | the provider port: plan, apply, verify, rollback and current (ADR 0352 d3)                             |
| `./node`    | `EncoreCloudProviderDriver`, `EasProviderDriver`, `MintlifyProviderDriver`                                        | the `encore-cloud`, `eas` and `mintlify` providers                                                     |
| `./node`    | `runCommand`, `CommandRunner`                                                                                     | how a provider runs its CLI, with no shell                                                             |
| `./node`    | `runMobileJob(request)`, `MobileJobRequest`, `MobileJobResult`                                                    | the mobile job: Expo config from `mobile`, capability stripping, EAS build                             |
| `./node`    | `runBrandStep(request)`, `committedBrandOutputs`, `BRAND_STEP_SETTINGS`, `BrandStepRequest`, `BrandStepRun`       | the brand step: @stackra/brand-kit per surface, app and white-label scope; the committed-outputs check |
| `./node`    | `screenshotCaptureJob(request)`, `runScreenshotCapture`, `SCREENSHOT_CAPTURE_DEFAULTS`, `ScreenshotCaptureJob`, … | the store-screenshot capture job on a Mac CI runner                                                    |
| `./node`    | `capabilityConfig(catalogue, flags)`, `MobileCapability`, `MobileStoreAccount`, …                                 | what a template line keeps and strips for a product's capability flags                                 |
| `.`         | `RunwayKind`, `RunwayEnvironment`, `TopologyMode`, `RequirementEngine`, `CacheEviction`                           | enums                                                                                                  |
| `.`         | `RunwayInvalidError`, `RunwayUnresolvedError`, `RunwayDeployFailedError`                                          | errors                                                                                                 |
| `./node`    | `definesFor(member, environment)`                                                                                 | the bundler `define` map: public vars and the injected runway facts                                    |
| `./node`    | `devServer(member)`                                                                                               | the Vite `server` block from the dev facts                                                             |
| `./node`    | `readRunway(file, kind)`                                                                                          | read, YAML-parse and check one runway file                                                             |
| `./schema/` | `root.json`, `app.json`, `service.json`                                                                           | `$schema: "@stackra/runway/schema/app.json"` in a runway file                                          |

The old `./ports` entry is folded into `.` and the old `./vite` entry into `./node` (ADR 0127, 2026-10-24 note).

## The two files

A member runway states what the member needs: `requires` (an engine ADR 0296 lists: `postgres`, `valkey`, `s3` or
`sns-sqs`, and a `reason` when `dedicated`), secret names, `health`, its release block, and per environment its port,
vars, config values and sizes.
It never holds `member`, `deployable`, `isolate`, `group`, `cpu`, `memory` or `instances`; those fail the schema. The
root runway states where members run: providers, destinations, shared pools, defaults and each environment's
`topology`. In a grouped environment every service member sits in exactly one group, or in the `default` group;
`checkPlacement` reports what is not.

`providers.npm` is typed: `registry` (an `https://` URL ending in `/`) is where the repository's packages publish,
and `scope` the npm scope it owns. For Stackra that is `https://npm.stackra.figentra.com/` and `@stackra` (ADR 0453);
the release workflow's `registry` input carries the same value to `runway-npm.yml`, and no member's `publishConfig`
names a registry.

```ts
import { checkPlacement } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

const root = readRunway("runway.yaml", "root");
const issues = checkPlacement(root, ["commerce", "notifications"]); // [] when every member is placed
```

## Surfaces, mobile apps and ops contributions

A product's root runway names what it ships into the OS shells (ADR 0441 decision 3, ADR 0436): `surfaces` maps a
surface key (`console`, `landing`, `till`, `portal`, …) to its shell line (`os/console@3`), an optional `preset`, the
product `packages` the shell loads, its `host` or `hosts` (at most one `canonical`) and a landing site's `content`.
`surfaces.ops` is different: the OS ships the one ops console, so a product only `contributes` to it, and only
declaratively: a package name, or `{ package, panels, resources, widgets }` whose entries are a `key`, a registered
`block` id (`os/table`), a `title` and data `props`. A `shell`, `component`, `entry` or a module path as a block fails
(app-shells 16.7). `mobile` maps an app key to its template line, packages, `assets` and `store` paths, identity,
capability flags, `tablet`, store accounts, EAS project and `whiteLabel` (the entitlement and the `managed` /
`bring-your-own` modes of the tenant-started per-tenant build, ADR 0439). Every asset path sits inside `assets/`.
An app runway's `release.mobile.whiteLabel` takes `true` or the same `whiteLabel` block.

## The mobile job

`runMobileJob` (`./node`) builds one app of the root runway's `mobile` from the OS mobile template (ADR 0439). A merge
starts it with no variant; an OS event for a scope starts a white-label build with a `variant` (the scope id and the
identity from the scope's brand and listing data). The caller checks out the app's template line into `templateDir`
and resolves the store accounts with `storeAccountsOf` from `@stackra/infra-mobile` (the scope's connected App Store
Connect key or Google Play service account, else the platform account in `mobile.<app>.stores`).

1. Checks the app exists, every platform it targets has a store account, a variant's app has `whiteLabel` and offers
   the mode each account needs (`managed` for a platform account, `bring-your-own` for a scope's), and the app names
   `eas.channel`.
2. A white-label build under the platform's Apple account waits on Apple guidelines 4.2.6 and 4.3: the job refuses it
   until `<store>/apple-guidelines.json` records each as `{ "result": "pass", "checkedAt", "by", "note" }`.
3. Reads the template line's `capabilities.json` (flag to `modules`, `plugins`, `ios.infoPlist`, `ios.entitlements`,
   `android.permissions`); `capabilityConfig` refuses a flag the line does not offer and lists what every other flag
   brings, except what an enabled flag also declares.
4. Writes the template checkout's `app.json`: the runway identity (name, bundle id, package, scheme, `applinks:` and
   verified intent filters for `links`, tablet), slug `<project>-<app>`, runtime version from the template line, the
   EAS project and update URL, the enabled flags' plugins, and the disabled flags' plugins, Info.plist keys and
   entitlements removed and Android permissions blocked; and `package.json` `expo.autolinking.exclude` with their
   native modules. Nothing is merely hidden at run time.
5. Starts `eas build` on the app's channel through `EasProviderDriver` from the checked-out commit.

```ts
import { storeAccountsOf } from "@stackra/infra-mobile";
import { readRunway, runMobileJob } from "@stackra/runway/node";

const root = readRunway("runway.yaml", "root");
await runMobileJob({
  repository: ".",
  app: "shopper",
  templateDir: ".stackra/mobile/shopper",
  sha,
  environment: "production",
  stores: storeAccountsOf(root.mobile!.shopper!, connections),
  variant: {
    scope: "scope_42",
    identity: { name: { en: "Acme" }, ios: { bundleId: "com.acme.shop" } },
  },
});
```

Not yet in the job: store submission (`eas submit` under the resolved account), wiring the brand step's icon and
splash into the Expo config (the step builds them, see below), installing the app's `packages`, per-locale store names, the app-link files
on the edge, and the app id pattern check of ADR 0439 decision 6.

## The brand step

`runBrandStep` (`./node`) runs `@stackra/brand-kit` (its `stackra-brand-kit` binary, on the CI job's PATH; runway takes
no dependency on the kit) once per web surface of the root runway (`ops` excluded, it has no shell) and once per
mobile app, each with the `BrandOutput` codes its kind needs (`BRAND_STEP_SETTINGS.outputs`) and its own folder under
`.stackra/brand` (`web/<surface>`, `mobile/<app>`). A scope-started white-label build passes `variant` (app, scope id,
and the scope's theme as a kit folder the job wrote) and gets one run of the app icon, adaptive icon and splash under
`.stackra/brand/scopes/<scope>/<app>`. `parentKitDir` passes a parent kit (the OS theme) as data; `check: true` runs
the kit's `--check` and writes nothing.

After a write, `committedBrandOutputs` reads each run's `asset-manifest.json` and asks `git ls-files` which listed file
(or manifest) is tracked; any hit fails the step with `RunwayInvalidError` (generated outputs are never committed,
ADR 0441 as amended, D17).

```ts
import { runBrandStep } from "@stackra/runway/node";

await runBrandStep({ repository: ".", parentKitDir: "../os/tools/brand-kit/figentra" });
await runBrandStep({
  repository: ".",
  variant: { app: "shopper", scope: "sc_42", kitDir: ".stackra/scope-kits/sc_42" },
});
```

## The store-screenshot capture job

`screenshotCaptureJob` (`./node`) defines the capture of one app's store screenshots from the real app on a simulator
with demo data, per locale (ADR 0441 as amended, D19): from `mobile.<app>.identity` (iOS bundle id and URL scheme) and
every `assets/store/<app>/<locale>/captions.json`, the ordered `xcrun simctl` commands that boot the simulator, install
the demo-data simulator build, and per locale launch in that language, open the demo link
(`{scheme}://demo?locale={locale}`), open each captioned screen (`{scheme}://store-screenshot/{screen}`) and save
`.stackra/screenshots/<app>/<locale>/<screen>.png`, the folder @stackra/brand-kit's store frames read.
`SCREENSHOT_CAPTURE_DEFAULTS` holds the runner label, simulator, folders, link templates and settle time; a request
overrides any of them. `runScreenshotCapture(job, repository)` runs exactly that list, on a Mac CI runner only (never a
developer's Mac). Not built: the CI workflow that schedules it (it needs a Mac runner), and the app's handling of the
two links (the mobile template line's).

## Dev lanes and the repository index

`environments.dev.lanes.repos` is the one repository index table (`os: 0, commerce: 1, …, academorix: 7`; no two
repositories share an index) and `lanes.worktrees` the lanes per repository (default 10): lane = index × worktrees +
worktree, and every dev port moves by lane × `portStep`. `checkPorts(root, members)` walks every lane of the table over
the root's dev infra ports (gateway, Encore dashboard, Postgres, otel UI, …; a block with `perLane: false` is one
shared port) and each member's dev ports (service, web, docs, dev console, Electron, Metro), and reports each
`duplicate_port` with both owners and each `port_out_of_range`:

```ts
checkPorts(root, { console: consoleRunway }); // [] when every effective port has one owner
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

### The self-hosted tools stack of each region

Each region an environment deploys to may run one shared tools stack (owner decision R3-5, ADR 0444): Documenso,
the OCR server, Nominatim and Photon on the region's OpenStreetMap extract, LibreTranslate and Chatwoot. Its block is
`providers.tools`, which the root schema already leaves open (a provider block needs no schema change); runway passes
it through and `@stackra/infra-tools` checks and plans it.

```yaml
providers:
  tools:
    environments: [staging, production] # the environments that run it, in each region they list
    extracts: # the OSM extract each region imports (gcc, egypt, eu, us, or one under sources)
      gcc: gcc
      eg: egypt
    network: # the VPC, private subnets and security groups (ids or ref:)
      gcc:
        vpcId: ref:network.gcc.vpc
        subnetIds: [ref:network.gcc.private-a, ref:network.gcc.private-b]
        securityGroupIds: [ref:network.gcc.tools]
    tools: # overrides of the catalogue defaults; enabled: false removes a tool
      ocr:
        image: ghcr.io/figentra/tools-ocr:1.0.0
      photon:
        image: ghcr.io/figentra/tools-photon:0.6.0
```

## Deploy, promote and roll back

`deployTargets(root, environment)` lists every place a release lands: each kind of member in build order, in each
region in release order, then each dedicated tenant's services. A dedicated target carries
`dedicated: { key, scope }`, where `scope` is the id the runway's `tenant` field gives (ADR 0323). `deploy` applies and verifies each target through its
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

| Provider       | apply                                                                                                            | verify                                    | rollback                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------- |
| `encore-cloud` | `git push encore://<app> <sha>:refs/heads/<branch>` (`encore.branch`)                                            | the branch holds the commit               | force-push the earlier commit      |
| `eas`          | `eas build --profile <channel>` or `eas update --channel` (`targets.eas`)                                        | build status, or the group                | republish the earlier group        |
| `mintlify`     | `stackra build` and `stackra lint`, then `.stackra/site` force-pushed as one commit to `targets.mintlify.branch` | the branch's `Source:` trailer is the SHA | refused: promote the last good SHA |

A store build cannot be rolled back; the EAS provider refuses it. The `mintlify` provider (STA-1316, ADR 0002 amendment
of 2026-10-27) publishes the site gen assembles in a docs app's `.stackra/site/`: the Mintlify GitHub app builds the
deploy branch, and only CI writes that branch, after the checks. Plans only for now: nothing applies it until the root
runway names `targets.mintlify.branch` and the owner points the GitHub app at that branch. Helm and Zarf output for on-prem waits for the first
prospect (ADR 0400).

One apply runs per environment at a time (ADR 0435): wrap a deploy, promotion, rollback or settings promotion in
`withDeployLock`, which holds `runway:deploy:<project>:<environment>` through your `@stackra/locking` `Locks` and
throws `RunwayLockedError` at once when another apply holds it.

```ts
await withDeployLock(root, "production", locks, () =>
  promote(root, "staging", "production", providers),
);
```

## Event fan-out between services

Integration events cross services on the broker, never by a topology setting. Gen writes each publishing service's
topics (`.stackra/encore/<member>/events.ts`, one per `<module>.<name>.v<n>` wire name) and, for a service with a relay
listener (the webhooks service), one subscription per integration topic of the product
(`.stackra/encore/<member>/relay.ts`), so every service's events reach the relay's inbox without a producer listing it.

```text
orders   -- orders.order.paid.v1 -------+
billing  -- billing.invoice.issued.v2 --+--> webhooks relay.ts --> InboxService --> relay listener
webhooks -- its own events -------------+
```

The topology does not change this: grouped, isolated or monolith, the same topics and subscriptions exist, and a
service in another group or region still subscribes through Encore Pub/Sub. Which `EventPublisher` driver publishes
(`inbox` in process, `broker` across services) is runtime configuration; the topics cost nothing while the in-process
driver runs. A new publishing service is subscribed on the relay service's next `stackra gen`.

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
