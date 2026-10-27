# @stackra/contracts

<!--
Stackra file contract:
Purpose: the package's reader guide: what @stackra/contracts exports (bases, enums, ports, types, `Duration`, the retry policy and `backoffDelay`, the config helpers) and how to use it.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0294; ADR 0295; ADR 0127 2026-10-24 note; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

The leaf vocabulary of Stackra: the `Port` and `Enum` bases, actor and id types, `Duration`, the platform enums, the
core ports `Clock`, `Logger`, `IdentityResolver`, `PrincipalDirectory`, `HealthIndicator`, `KeyProvider`, `FieldCipher` and `Signer`, the manifest type and the four `stackra.config.ts` helpers.

**Tier:** `tier:lib` (`packages/foundation/contracts`), entry `.` only, no workspace dependency. Every other Stackra
package may import it; it imports nothing.

## What is here

| Symbol                                                                                                                                    | Kind      | Use                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `Port`                                                                                                                                    | kind base | `abstract class X extends Port`: a contract a driver implements; its token    |
| `Enum`                                                                                                                                    | kind base | `export const X = Enum.of({...})` plus `export type X = Enum.Value<typeof X>` |
| `Duration`                                                                                                                                | value     | `Duration.minutes(10)` is `"PT10M"`; `parse`, `toMilliseconds`                |
| `ActorKind`, `ApiArea`, `DataClassification`, `HttpMethod`, `Realm`, `SortDirection`, `Target`, `Tone`, `MigrationRunner`, `HealthStatus` | enums     | the platform's closed sets                                                    |
| `AssuranceLevel`, `MeterKind`                                                                                                             | enums     | step-up levels (actions, identity); usage meter kinds (actions, model)        |
| `RetryPolicy`, `Backoff`, `Jitter`, `RetryOn`, `backoffDelay(policy, attempt)`                                                            | retry     | the one retry shape and backoff formula (stackra-223)                         |
| `Clock`, `Logger`, `IdentityResolver`, `PrincipalDirectory`                                                                               | ports     | inject by type; drivers live in container, logger and identity                |
| `HealthIndicator`, `KeyProvider`, `FieldCipher`, `Signer`                                                                                 | ports     | a probed dependency; data keys; seal and open a field; sign; drivers below    |
| `Actor`, `PublicId<P>`, `Branded<T, B>`, `Email`, `Url`, `Json`, `VerifiedPrincipal`, `HealthReport`, `DataKey`                           | types     | the caller, ids and value types the shape compiler knows                      |
| `GeoPoint`                                                                                                                                | type      | the one latitude and longitude (rules geo facts, shipping, geocoding)         |
| `brand<B>()`                                                                                                                              | function  | the one constructor of a branded type                                         |
| `mintPublicId(prefix, time?)`                                                                                                             | function  | the one public-id minter (UUIDv7, ADR 0135)                                   |
| `StackraManifest`                                                                                                                         | type      | reading a committed `stackra.manifest.json`                                   |
| `defineApp`, `defineService`, `definePackage`, `defineWorker`                                                                             | functions | the one call in a member's `stackra.config.ts`                                |

`Duration.parse` also reads the short form (`"200ms"`, `"30s"`, `"6h"`, `"1d"`), which replaced the integrations
`Interval` string. A retrying package keeps its own `base` and `max` defaults as a frozen constant and passes them to
`backoffDelay`; the curve is capped at `max` before the jitter (`Jitter.Equal` keeps the upper half, `Jitter.Added`
adds up to half again).

## Data classification and principals

`DataClassification` has five codes: `personal`, `financial`, `health`, `pseudonymous` and `regulated` (identifiers a
regulator issues or governs, such as a tax registration number or a national id). `IdentityResolver#principalOf`
returns the verified address, verified phone, locale and time zone of a principal; `PrincipalDirectory#supervisorOf`
returns who a principal reports to in a scope, or `null`. Both answer at the moment of use, so no caller stores them.
The canonical JSON of a value and its hash are `canonicalJson` and `canonicalHash` of `@stackra/support`, not here.

## Enums

```ts
import { Enum, Tone } from "@stackra/contracts";

export const LoyaltyTier = Enum.of({
  Bronze: ["bronze", { tone: Tone.Default, multiplier: 100 }],
  Gold: ["gold", { tone: Tone.Warning, multiplier: 200 }],
});
export type LoyaltyTier = Enum.Value<typeof LoyaltyTier>;

LoyaltyTier.Gold; // "gold": a plain code, compared with ===
Enum.values(LoyaltyTier); // ["bronze", "gold"], in source order
Enum.meta(LoyaltyTier, LoyaltyTier.Gold).multiplier; // 200
```

Codes are snake_case house values. `HttpMethod` keeps HTTP's own upper-case tokens, because they are the tool's.

## Ports

```ts
import { Port } from "@stackra/contracts";

export abstract class LoyaltyMembers extends Port {
  abstract isMember(principalId: MemberId): Promise<boolean>;
}
```

The class is the token. Gen derives its key (`loyalty_kit.LoyaltyMembers`) and prints the wiring; nothing reads
metadata at runtime.

## Drivers that ship here

This package sits below `@stackra/container`, so these are plain subclasses of their ports, listed as candidates in a
host's wiring like any driver:

- `AesGcmFieldCipherDriver`: AES-256-GCM over a `KeyProvider`, `v1.<keyId>.<iv>.<ciphertext>`, the context as
  additional data, so a value opens only where it was sealed and a rotated key still opens old rows.
- `MemoryKeyProviderDriver`: data keys handed to it in process.
- `AwsKmsKeyProviderDriver`: one tenant's data keys, stored wrapped and unwrapped by AWS KMS bound to the tenant and key
  id (`wrapScopeKey` makes a new one); the KMS key is the environment's managed key or the tenant's own ARN. The host
  passes the SDK's `KMS` client (any `AwsKmsApi`); this package takes no SDK dependency.
- `SubjectKeyProviderDriver`: a key per data subject, HKDF-derived from the tenant's key and the subject's own salt;
  destroying the salt crypto-shreds that subject only.
- `MemorySignerDriver`, `AwsKmsSignerDriver`: the `Signer` port (ES256); KMS signs digests so the private key never
  leaves it. `verifySignature` checks a signature offline against a `SignerPublicKey`.
- `NoopTracerDriver`: the default `Tracer`; the OTLP tracer ships with the telemetry runtime.

## Member definitions

```ts
// services/commerce/stackra.config.ts
import { ApiArea, defineService, MigrationRunner } from "@stackra/contracts";

export default defineService({
  area: ApiArea.App,
  migrations: { runner: MigrationRunner.Auto },
});
```

The helpers return their argument: gen reads it from the syntax tree, and the types catch a wrong option in the
editor. The tool sections of `defineApp` (`ios`, `expo`, `pwa`, `electron`, …) stay open until gen ships their shapes.

## Decisions

ADR 0294 (kinds, enums, ports), ADR 0295 (`stackra.config.ts`), ADR 0098 (the actor), ADR 0135 (public ids), ADR 0303
(the five tones), ADR 0159 (the migration runner), and the 2026-10-24 note on ADR 0127, which puts `Port`, `Enum`, the
`define*` helpers, `MigrationRunner` and the one `Tone` here.
