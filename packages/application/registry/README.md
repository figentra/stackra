<!--
Stackra file contract:
Purpose: the reader guide of @stackra/registry: catalogue validation, the app market records, edition records and the
         edition install plan.
Boundary: documentation of packages/application/registry only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0109; ADR 0335 (as amended by ADR 0349); ADR 0355 (decision 8).
-->

# @stackra/registry

Stackra module catalogue validation: the checks a registry service runs on the `stackra.manifest.json` files CI
publishes (ADR 0109), before it accepts them into its catalogue. Every result is a list of diagnostics in a fixed order,
so the same manifests always give the same output. Beside it, the app market records the registry carries (ADR 0355
decision 8: the review state, developer sandboxes, fee schedules and partner payouts) and the edition install plan
(ADR 0335 decision 5).

**Tier:** `tier:lib` (`packages/application/registry`). One entry, `.`. Depends on `@stackra/contracts`,
`@stackra/validation` and zod. Pure functions, no I/O.

## What is here

| Symbol                                                 | Use                                                                                                                          |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `validateCatalogue`                                    | checks a set of manifests as one catalogue; returns `CatalogueDiagnostic[]`, empty when valid                                |
| `CatalogueManifest`                                    | the shape of one published manifest: header plus `modules`, `actions`, `events`, `permissions`, with the catalogue fields    |
| `deliverableEvents`, `DeliverableEventRow`             | the webhook event catalogue rows of a release (opt-ins, thin or full, withdrawals), to register at manifest publish          |
| `DeliverablePayload`                                   | `thin` or `full`, the body a webhook endpoint receives for a catalogue event                                                 |
| `CatalogueDiagnosticCode`                              | the seven codes below                                                                                                        |
| `CatalogueDiagnostic`                                  | type: `{ code, member, path, message }`                                                                                      |
| `ReviewState`, `canTransitionReview`                   | an app version's review state and the moves allowed between states                                                           |
| `AppReview`, `DeveloperSandbox`                        | the review record of an app version; a developer's sandbox and the apps under test in it                                     |
| `FeeSchedule`, `PartnerPayout`, `computePartnerPayout` | a partner fee schedule (basis points plus a fixed fee), one period's payout, and the fee and net of a gross under a schedule |
| `EditionBundle`, `planEditionInstall`                  | an edition's base, own modules and bundled base modules; the install order, inert contributions and issues for one tenant    |
| `checkEditionBundle`, `EditionBundleIssue`             | an edition's bundle against its base's released modules, before the registry lists it                                        |

## Use

```ts
import { CatalogueManifest, validateCatalogue } from "@stackra/registry";
import { validate } from "@stackra/validation";

const diagnostics = validateCatalogue([...storedManifests, incoming]);
if (diagnostics.length > 0) return refuse(diagnostics);

const manifest = validate(CatalogueManifest, incoming); // typed, now known to pass
```

## Checks

| Code                 | Reported when                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `manifest_invalid`   | the manifest breaks its shape (one per issue); it is not checked further                                         |
| `duplicate_member`   | another manifest already has this member key; the later one is not checked further                               |
| `identity_collision` | a module key, action key, event name or permission key is declared twice                                         |
| `unknown_module`     | an action or event names a module its own member does not declare                                                |
| `foreign_namespace`  | an action key or event name does not start with `<its module>.`, or a permission key with a module of its member |
| `unknown_dependency` | a module depends on a module no manifest declares                                                                |
| `dependency_cycle`   | modules reach each other through `dependsOn` (one per group, on its smallest key)                                |

## Catalogue fields

Beside the identities, a manifest entry may carry the fields a registry stores. They are optional; a wrong value is a
`manifest_invalid` diagnostic at its path.

| Entry     | Field         | Meaning                                                                                          |
| --------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `modules` | `enhances`    | module keys it adds to without needing them                                                      |
| `modules` | `intents`     | the assistant intents it serves (the tenant's union is the assistant's)                          |
| `modules` | `entitlement` | the entitlement key that sells it; absent when free                                              |
| `actions` | `tool`        | gen's `{ name, default, hints }` (or `true`): an agent may call it                               |
| `actions` | `toolOff`     | why a user-facing action is not a tool                                                           |
| `events`  | `webhook`     | `true` opts the event into tenant webhooks                                                       |
| `events`  | `dataClasses` | the personal-data classes (`DataClassification`) its payload carries; any makes the webhook thin |
| `events`  | `thinFields`  | for a thin payload, the non-id fields kept                                                       |

## Webhook event catalogue

```ts
import { deliverableEvents } from "@stackra/registry";

for (const row of deliverableEvents(incoming, storedPreviousRelease))
  await webhooks.registerDeliverableEvent(row); // { type, payload: "thin" | "full", thinFields?, withdrawn? }
```

Only `webhook: true` events become rows; an event that declares a data class leaves thin (ids plus `thinFields`). An
event the previous release offered and this one does not comes back with `withdrawn: true`. Rows sort by wire name.

## App market records

```ts
import { canTransitionReview, computePartnerPayout, ReviewState } from "@stackra/registry";

canTransitionReview(ReviewState.InReview, ReviewState.Approved); // true; Rejected is final
computePartnerPayout(10_005, schedule); // { grossMinor: 10_005, feeMinor: 2_001, netMinor: 8_004 } at 2,000 bp
```

A fee schedule's rate, fixed fee, currency and start date are catalogue data (`fee-schedule:<name>`); the payout
rounds the rate half up to a whole minor unit and never keeps more than the gross.

## Edition install

`planEditionInstall(bundle, modules, installed)` installs an edition's own modules and the base modules it bundles in
dependency order (ties in code-unit order), leaving installed ones out. A dependency outside the bundle is never pulled
in (`missing_dependency`): a base module the edition does not bundle is not available to its tenants. A module that
only `enhances` another installs without it and its contribution is listed as inert until that module is present.
Any issue (`unknown_module`, `missing_dependency`, `dependency_cycle`) stops the whole plan.

## Edition records

`EditionBundle` is the registry's record of an edition (ADR 0335): its product key, the base and version range from the
root runway's `product.edition` (written there once, stackra-06; copied here, never edited here), its own modules, the
base modules it bundles, and the range packs (`packs`) and role presets (`rolePresets`) it seeds, as record keys. Packs
and presets are data the seeding service owns; the record only names them. `checkEditionBundle(bundle, base)` takes the
modules of the base's released manifests in the version range (the caller resolves the range) and refuses
`base_unknown` (none), `bundled_module_unknown` and `module_key_taken` (ADR 0349), in code-unit order.

## Order

Manifests are walked sorted by member key and package name, so the first owner of an identity is the same whatever
order they arrive in, and the later declaration carries the diagnostic. The diagnostics are sorted by member, path,
code and message, compared by code unit, never by locale. `path` points into that member's manifest, as
`modules[0].dependsOn[1]`; it is `""` for the manifest itself.

## Not here

The registry client, the merged catalogue a consumer keeps, the review queue and who may move a review, the storage of
these records and the manifest version diff belong to the registry service (ADR 0214, ADR 0157); the review rules,
sandbox counts and fee values are Figentra's (OS ADRs 0037 to 0039).
