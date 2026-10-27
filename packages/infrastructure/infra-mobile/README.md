# @stackra/infra-mobile

<!--
Stackra file contract:
Purpose: the package's reader guide: the mobile release plan from the runways, its owner tasks, the Pulumi slice and
         the store-account resolution of the mobile job.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0171; ADR 0180; ADR 0344 (decision 11); ADR 0439 (decisions 7 and 8); app-shells D14.
-->

Mobile release infrastructure (ADR 0171): the EAS project and environments, the App Store and Play records, the push
credentials and EAS-managed signing of a repository's mobile app, read from its runways, plus the slice of the
generated Pulumi program that resolves and checks those facts from the stack config.

**Tier:** `tier:lib` (`packages/infrastructure/infra-mobile`). Entries `.` (isomorphic, no Pulumi) and `./node` (the
Pulumi slice). Depends on `@stackra/contracts`, `@stackra/runway`, `@stackra/integrations` (its `./contracts`: `MobileStore`)
and `@pulumi/pulumi`.

## What is here

| Entry    | Symbol                                             | Use                                                                                                |
| -------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `.`      | `mobileInfraPlan(root, app, identity)`             | the release plan and its owner tasks from the root and mobile runways                              |
| `.`      | `MobileOwnerStep`                                  | the manual steps no API takes (enum of snake_case codes)                                           |
| `.`      | `storeAccountsOf(app, connected?)`                 | the account each store of a mobile app publishes under (managed or own)                            |
| `.`      | `MobileInfraInvalidError`                          | every runway or stack config failure at once, with its path                                        |
| `.`      | `MobileHealthIndicatorDriver`, `InfraMobileConfig` | the `HealthIndicator` driver: the EAS update endpoint answers; its target is `config.infra_mobile` |
| `.`      | `MobileInfraPlan`, `MobileIdentity`, …             | types                                                                                              |
| `./node` | `mobileStack(plan)`                                | inside the Pulumi program: resolve every `ref:` fact and check its shape                           |

## Where the facts come from

| Fact                                        | Runway                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| EAS account and project                     | root `providers.expo.account`, `providers.expo.projectId`                                                                  |
| Apple team, App Store Connect app record    | root `providers.apple.teamId`, `providers.apple.ascAppId`                                                                  |
| Play developer account, app-signing SHA-256 | root `providers.google.playDeveloperId`, `appSigningSha256`                                                                |
| Signing mode (must be `eas-managed`)        | root `targets.eas.credentials`                                                                                             |
| Which environments ship through EAS         | root `environments.<env>.destinations.mobile: eas`                                                                         |
| Build profile, channel, EAS environment     | member `environments.<env>.mobile.{profile,channel}` (root channel as fallback), `release.mobile.profiles.<p>.environment` |
| Store submission per platform               | member `release.mobile.submit.{ios,android}`                                                                               |
| Bundle id, package, native surface ids      | the member's `stackra.config.ts` and `stackra.manifest.json` (the caller passes them)                                      |

The App Store record is needed only when the member submits to the App Store, and the Play facts only when it submits
to Play. Each environment that ships through EAS needs a profile, a channel and an EAS environment of its own (runway
syncs one EAS environment per runway environment, ADR 0173). A native surface's bundle id starts with the app's, and
the surfaces share one app group, `group.<bundleId>` (ADR 0344 decision 3, ADR 0345 decision 2).

```ts
import { mobileInfraPlan } from "@stackra/infra-mobile";
import { readRunway } from "@stackra/runway/node";

const plan = mobileInfraPlan(
  readRunway("runway.yaml", "root"),
  readRunway("apps/mobile/runway.yaml", "app"),
  {
    ios: { bundleId: "example.acme.mobile", surfaces: ["example.acme.mobile.widget"] },
    android: { package: "example.acme.mobile" },
  },
);

// .stackra/infra/index.ts (generated by `stackra infra gen`)
import { mobileStack } from "@stackra/infra-mobile/node";
export const mobile = mobileStack(plan); // ids resolved from Pulumi.<env>.yaml
```

## `ref:` values

A fact is a literal id (a private product repository may inline one) or `ref:<path>`, resolved from the private
stacks repository's Pulumi stack config (ADR 0171 decision 4, as amended by 0289 decision 9). The first dot of the
path is the namespace: `ref:expo.projectId` reads `expo:projectId`. An unset key fails `pulumi preview` naming it, and
a resolved value of the wrong shape (an EAS project id that is not a UUID, a team id that is not ten upper-case
characters, a fingerprint that is not 32 hex pairs) fails it with a `MobileInfraInvalidError`. These are ids, never
secret values (ADR 0173).

## Owner tasks

No Pulumi provider creates an EAS project, an App Store Connect app record or a Play app, and EAS itself registers
bundle ids, syncs their capabilities and holds the signing certificates and push keys (`targets.eas.credentials:
eas-managed`). So `mobileStack` creates no resource, and the plan lists what the owner does by hand (ADR 0344
decision 11), each with the stack config key its result goes under when the runway names it as a `ref:`:

| Step               | When               | What                                                                     |
| ------------------ | ------------------ | ------------------------------------------------------------------------ |
| `eas_project`      | always             | create the EAS project under the account; record its id                  |
| `apple_team`       | iOS                | record the Apple developer team id                                       |
| `app_store_record` | iOS, submitted     | create the App Store Connect app record; record its Apple ID             |
| `ios_signing`      | iOS, per bundle id | run `eas credentials` once (certificate, profile, a surface's app group) |
| `apns_key`         | iOS                | give EAS the APNs key Expo push sends with                               |
| `play_app`         | Android, submitted | create the Play app and upload its first build; record the account id    |
| `play_app_signing` | Android, submitted | record the Play app-signing certificate's SHA-256                        |
| `android_signing`  | Android            | run `eas credentials` once for the upload keystore                       |
| `fcm_key`          | Android            | give EAS the FCM V1 service-account key Expo push sends with             |

## Store accounts

`storeAccountsOf(app, connected)` gives the mobile job (`runMobileJob` in `@stackra/runway/node`) one account per
store the app targets (ADR 0439 decisions 7 and 8, app-shells D14). A scope that connected its own store account (a
Connection implementing `StoreAccountConnector`: an App Store Connect API key or a Google Play service account) gets
`{ owner: "scope", connection }` for that store; every other store publishes under the platform account the root
runway names in `mobile.<app>.stores.<apple|google>.account` (`{ owner: "platform", account }`). A merge-started build
passes no connections. A targeted store with neither fails with `stores.<apple|google>.account`. Ids only: the key is
read on the CI runner through the Connection's credential reference, never here.

```ts
import { storeAccountsOf } from "@stackra/infra-mobile";
import { MobileStore } from "@stackra/integrations/contracts";

storeAccountsOf(root.mobile!.shopper!, [
  { store: MobileStore.GooglePlay, connection: "conn_play" },
]);
// [{ store: "app_store", owner: "platform", account: "figentra" },
//  { store: "google_play", owner: "scope", connection: "conn_play" }]
```

The white-label mode check and the Apple 4.2.6 and 4.3 record are the job's, not this function's.

## Not here

- Syncing runway `vars` into EAS environments, and creating a custom EAS environment such as `staging`: runway's deploy
  step (ADR 0173 decision 1).
- `eas.json` and the Expo app config: gen (ADR 0295, 0345).
- The store checklist of screenshots and availability switches: gen (ADR 0325 rule 9).
- Update channels: EAS creates a channel on the first build or update that names it.
- Agents run `pulumi preview` at most; `pulumi up` is the owner's.
