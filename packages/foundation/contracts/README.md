# @stackra/contracts

The leaf vocabulary of Stackra: the `Port` and `Enum` bases, actor and id types, `Duration`, the platform enums, the
core ports `Clock`, `Logger`, `IdentityResolver`, `HealthIndicator`, `KeyProvider` and `FieldCipher`, the manifest type and the four `stackra.config.ts` helpers.

**Tier:** `tier:lib` (`packages/foundation/contracts`), entry `.` only, no workspace dependency. Every other Stackra
package may import it; it imports nothing.

## What is here

| Symbol                                                                                                                                    | Kind      | Use                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `Port`                                                                                                                                    | kind base | `abstract class X extends Port`: a contract a driver implements; its token                |
| `Enum`                                                                                                                                    | kind base | `export const X = Enum.of({...})` plus `export type X = Enum.Value<typeof X>`             |
| `Duration`                                                                                                                                | value     | `Duration.minutes(10)` is `"PT10M"`; `parse`, `toMilliseconds`                            |
| `ActorKind`, `ApiArea`, `DataClassification`, `HttpMethod`, `Realm`, `SortDirection`, `Target`, `Tone`, `MigrationRunner`, `HealthStatus` | enums     | the platform's closed sets                                                                |
| `Clock`, `Logger`, `IdentityResolver`                                                                                                     | ports     | inject by type; drivers live in container, logger and identity                            |
| `HealthIndicator`, `KeyProvider`, `FieldCipher`                                                                                           | ports     | a probed dependency; envelope-encryption data keys; seal and open a field; no driver here |
| `Actor`, `PublicId<P>`, `Branded<T, B>`, `Email`, `Url`, `Json`, `VerifiedPrincipal`, `HealthReport`, `DataKey`                           | types     | the caller, ids and value types the shape compiler knows                                  |
| `brand<B>()`                                                                                                                              | function  | the one constructor of a branded type                                                     |
| `StackraManifest`                                                                                                                         | type      | reading a committed `stackra.manifest.json`                                               |
| `defineApp`, `defineService`, `definePackage`, `defineWorker`                                                                             | functions | the one call in a member's `stackra.config.ts`                                            |

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
