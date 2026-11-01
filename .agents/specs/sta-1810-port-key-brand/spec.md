# Specification: `DriverName<Port>` narrows by the port's class, read from a gen-written registry

**Feature Branch**: `figentra/sta-1810-port-key-brand-design`

**Created**: 2026-11-01

**Status**: Implementing (steps 1 to 4; 5 and 6 and open questions 1 and 2 deferred by the leader)

**Linear**: STA-1810

**Clarifications status**: complete

**Input**: Follow-up to STA-1805. `DriverName<P>` (`packages/foundation/container/src/core/types/driver-name.type.ts`)
narrows to a port's own driver names only when `P` carries a type-only `readonly "~key": "<member>.<Port>"` brand;
otherwise it widens to every name in `DriverRegistry`. STA-1805 (`06f213b8`) stopped the symptom (`X$Check` omits
driver-name fields, `emit-schemas.function.ts`) and rejected the obvious fix: gen writing
`declare module "<port.from>" { interface <Port> { readonly "~key": ... } }`, because `port.from` is often a barrel
that re-exports the class. This spec settles that question and picks the design. Spec only; no implementation.

## Decision

Gen does not brand the port. It emits, beside the existing `DriverRegistry` augmentation in `#stackra/wiring`, a
second augmentation `PortRegistry`, keyed by the same port key and valued by the port class the file already imports
(`ref(port)`): `"loyalty_kit.LoyaltyLedger": LoyaltyLedger`. `DriverName<P>` reads the `~key` brand first (the 182
ports that spell one today keep working), and otherwise takes the names under every `PortRegistry` key whose class is
identical to `P`. A port nobody registered still takes every registered name, so a misspelling is still an error.
Gen also checks every hand-written `~key` against the derived key and refuses a mismatch (six ports spell it wrong
today, see Findings).

The augmentation target is `@stackra/container`, a real module that declares `PortRegistry` itself, so no augmentation
goes through a re-export and nothing touches a port class: no new required member, so drivers, `Driver(Port)` mixins
and fakes are unaffected.

## Impact

- **Apps touched**: none
- **Services touched**: none in core; consumers' generated `wiring.ts` gains a `PortRegistry` block on their next gen
- **Packages touched**: `packages/foundation/container` (`PortRegistry` interface, `DriverName`, their type tests),
  `packages/developer/gen` (`emit-wiring.function.ts`, a validation check, tests and the wiring golden fixtures)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decision 26, the registry keyed by port key, is unchanged; the `DriverName` docblock
  sentence "which gen may add by augmentation" is replaced)
- **New dependencies**: none
- **Deploy modes**: all, no change (type-level and generated output only)
- **Licence tier**: free
- **Docs to update**: the `DriverName` and `DriverRegistry` file contracts; no docs page names the `~key` brand
- **Lane**: full (a public type of `@stackra/container` and an emitter contract; `architecture-guardian` reviews gen
  output)
- **Change risk**: R2 (every member's typecheck reads the generated block; golden files change)

## Findings

Types and sources only; nothing was compiled on this machine.

1. **Augmenting through a re-export does not merge, and can fork the declaration.** The handbook says "the module name
   is resolved the same way as module specifiers in `import`/`export`" and "the declarations in an augmentation are
   merged as if they were declared in the same file as the original", with "you can't declare new top-level
   declarations in the augmentation -- just patches to existing declarations" (TypeScript handbook, Declaration
   Merging, "Module Augmentation"). For a re-export the maintainers say the opposite of merge: "once you import
   something, it will never merge ... TypeScript should error here. And it does -- if you explicitly say
   `export { Foo } from '~B'`" (sandersn, microsoft/TypeScript#9532); the symptom is "the interface gets forked into two
   definitions, the downstream module sees only the interface surface that was added and the upstream module only sees
   the interface surface it defined" (#18877, still open; known limitation, workaround "augment the module that
   directly exports the declaration"). #50455 ("When aliases and local declarations merge, basically nothing works")
   covers the alias-plus-local merge itself.
2. **The checker confirms the split by re-export style.** TypeScript v5.9.2 `checker.ts`, `mergeModuleAugmentation`:
   an augmentation member is merged into the original symbol only for an `export *` re-export
   (`mainModule.exports.get(InternalSymbolName.ExportStar)` and `resolvedExports.has(key) && !mainModule.exports.has(key)`);
   a named re-export is an alias symbol in `mainModule.exports`, so the augmentation is merged onto the alias, not onto
   the class. Every barrel in this repo uses named re-exports (`export { EntitlementSource } from
"#contracts/ports/entitlement-source.port"`, `packages/security/entitlements/src/contracts/index.ts`), zero use
   `export *`. So `declare module "@stackra/entitlements/contracts" { interface EntitlementSource ... }` is the unsafe
   case: the `~key` member would not reach the class, and the interface may be a conflicting separate symbol.
   `package.json` `exports` and `#` subpath `imports` do not change this: both only decide which file the specifier
   resolves to (a `#` specifier resolves from the generated file's nearest `package.json`, the member's); what is
   merged depends on that file's export style. I found no source that makes moduleResolution `bundler` or `nodenext`
   behave differently on this point; not tested here.
3. **Option (a), the declaring file's specifier, cannot work for packages.** A consumer sees a package through its
   built, rolled-up `.d.ts` and its `exports` map; the source file path gen knows is not an importable specifier, and
   a package port reached through `dependencies` has only a manifest `classes` entry. Only a member's own ports could
   use it.
4. **A required `~key` member is already the house pattern, and it is safe for drivers.** `Port` itself declares
   `declare readonly "~kind": "port"` (`packages/foundation/contracts/src/core/bases/port.base.ts`). `Driver(P)` returns
   `abstract new () => InstanceType<P>`, so a driver inherits whatever the port instance type has. Fakes in tests are
   written `{ now: () => ... } as Clock` or `new FixedClock(...)`, never a bare typed object literal (grep over
   `packages` and `services`); an assertion needs only that `Clock` is comparable to the literal's type, which a new
   member on `Clock` does not change. No port extends another port (`*.port.ts`), so a merged `~key` would not collide
   with a base's `~key` (TS2417). So branding is type-safe; the problem is only where the augmentation would be
   written.
5. **The premise "nothing writes the brand" is half true.** Authors write it by hand: 182 of 298 `*.port.ts` files
   that extend `Port` declare `declare readonly "~key": "<member>.<Port>"`, 116 do not (entitlements, identity,
   consent, iam, tenancy, scope, analytics, runway, and the failing `ModuleInstalls`). Six are wrong, because the
   member key is snake_case (`loyalty_kit`) and they spell it with a hyphen: `data-transfer.{ImportLedger,
TabularReader,TabularWriter,WarehouseSink}`, `market-packs.PackStore`, `native-spotlight.DeviceSearchIndex`. Such a
   brand matches no `DriverRegistry` key, so `DriverName` of that port is `never`, silently. That is the evidence
   against option (b) as the rule: a typed identity drifts, against ADR 0294 decision 20 (identities are derived, not
   typed).
6. **Parity limit.** `DriverRegistry[key]` lists a member's own drivers only (`owned`), while the schema's `z.enum`
   lists every candidate (own plus each declared package's). The two sets are equal only when a member adds no
   driver to a package port. Narrowing alone therefore does not make `X$Check` safe to restore; STA-1805's omission
   stays (FR-007).

## Design alternatives

| Option                                                 | Verdict       | Why                                                                                                                          |
| ------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Augment `<port.from>` with `interface <Port> { ~key }` | rejected      | Finding 1 and 2: named barrels fork or miss the merge; a wrong merge breaks typecheck in every member                        |
| (a) Augment the declaring file's specifier             | rejected      | Finding 3: no importable specifier for a package's port; own ports only                                                      |
| (b) Port declares its own brand at authoring time      | keep as is    | Works (182 ports), but typed identity drifts (six wrong) and 116 ports lack it; gen validates it instead of requiring it     |
| (c) `PortRegistry` map by class, `DriverName` reads it | **chosen**    | Augments `@stackra/container` (a real module), values are the classes the wiring file imports already, touches no port class |
| (d) Keep STA-1805 only                                 | stays beneath | Fine as the safety net; leaves `DriverName` widened for 116 ports, so a misspelt-but-registered name of another port passes  |

Known limit of (c): identity is structural, so two ports with identical members (and no brand) both match, and the field
takes the union of their names: a widening, never a wrong narrowing. A port with no own driver in this member's
wiring has no `PortRegistry` entry and keeps today's widened union.

## Requirements

- **FR-001** `@stackra/container` declares an empty `PortRegistry` interface (port key to port class) beside
  `DriverRegistry`, augmentable by gen, with a file contract naming ADR 0294 decision 26.
- **FR-002** `DriverName<P>` returns `DriverRegistry[K]` for the `~key` brand when `P` has one; otherwise for the keys
  `K` of `PortRegistry` whose class is identical to `P`; otherwise every registered name. A misspelt name stays an
  error in all three cases.
- **FR-003** Gen's `emitWiring` writes the `PortRegistry` augmentation in the same `declare module "@stackra/container"`
  block as `DriverRegistry`, one row per registered port key, sorted, valued by the class `ref(port)` the file
  imports; no row for a port with no own driver; byte-identical on a second run.
- **FR-004** Gen never writes `declare module` for a port's own specifier, and writes no `~key` member.
- **FR-005** Gen refuses a port whose hand-written `~key` differs from the derived `<member>.<Port>` key, with a
  machine code `port_key_mismatch` (snake_case), naming the file and both keys.
- **FR-006** The six hyphenated brands are corrected to the derived key by their owners (each package's owner, not
  this change's author), or the check is landed with them listed in the issue.
- **FR-007** `X$Check` keeps omitting driver-name fields (STA-1805) until the registry lists every candidate the
  `z.enum` lists; a separate issue, not this one.

## Edge cases

- **EC-001** Two ports with identical members and no brand: the field type is the union of both ports' names.
- **EC-002** A port registered by a package's wiring and again by the member: one key, one row; a row is emitted once
  per key.
- **EC-003** A port whose class is imported under an alias in `wiring.ts` (`ref(port)` returns the alias): the row
  uses the same alias.
- **EC-004** A member that has no own drivers emits no `PortRegistry` block, as it emits no `DriverRegistry` block.

## Open questions

1. Retire the hand-written `~key` once (c) ships (a codemod over 182 port files, owned by each package; a derived
   identity should not be typed, ADR 0294 decision 20) or keep it as an accepted optimisation? Recommended: retire,
   in its own issue, after FR-005 has run clean for one train; not part of this change.
2. Should `PortRegistry` rows also be emitted for a package's ports whose names the member does not own, so a
   `DriverName<PackagePort>` narrows to the package's names? That needs the package manifest's driver names in the
   registry (the parity limit, Finding 6); decide together with the `X$Check` restore.
3. The TypeScript behaviour of `export { X }` inside a rolled-up `.d.ts` (a consumer augmenting a package's own
   barrel) was read from the checker, not compiled; an `expectTypeOf` test in the implementation (P-004) will show it.

## Status history

- 2026-11-01 → Clarified (design settled from sources; no code)
- 2026-11-01 → Implementing: `PortRegistry`, `DriverName`, wiring rows, `port_key_mismatch`. Answers: open question 1 retire the hand-written brand later, own issue; open question 2 package ports later; FR-007 stays.
