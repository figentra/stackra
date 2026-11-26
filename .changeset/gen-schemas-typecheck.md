---
"@stackra/gen": minor
"@stackra/validation": minor
"@stackra/typescript-config": minor
"@stackra/container": patch
"@stackra/analytics": patch
"@stackra/panel": patch
"@stackra/settings": patch
"@stackra/registry": patch
"@stackra/csp": patch
"@stackra/database": patch
"@stackra/cli": patch
"@stackra/runway": patch
"@stackra/platform": patch
"@stackra/fiscal": patch
---

**Generated code now typechecks, and every library member checks it.** The `library` preset of `@stackra/typescript-config` includes `.stackra/gen` and `.stackra/entry`, so a type error in what `stackra gen` writes (a schema, its `X$Check`, the wiring) fails the member's own `typecheck` instead of hiding until a consumer builds it. Every member of this repo passes with it (STA-1605).

What gen writes differently:

- **Object and array defaults** are `withDefault(schema)(() => literal)`, a new `@stackra/validation` export (with the type `DefaultLiteral`): the literal is typed by the field's output, so a nested code stays its literal type, a record keeps its value type and a nested `Duration` may be its ISO 8601 text. Before, zod's overloads widened `"page"` to `string` (TS2769).
- **`X$Check`** leaves out a model's computed getters and reads a generic shape (`ChangeBase<S>`) over `any` arguments (TS2344, TS2314). `Fields` and `InputFields` drop symbol keys such as MikroORM's `[OptionalProps]`.
- **The `~defaults` brand** is no longer written for a model or a generic shape, and the entity files no longer list it (TS2741, TS2428).
- **A driver-name field** whose port has no driver reaching the member is `z.string()` instead of `z.enum([])`, which refused every value.
- **Wiring**: an authored `DriverRegistry` augmentation (a package stand-in naming every driver of its port) is not declared a second time (TS2717); a client entry's same-named driver variant no longer duplicates the neutral one (TS1117); a package's `./worker` driver is listed only in a Worker member's wiring; an imported class keeps the name its import gives it (`MikroORM` from `@mikro-orm/postgresql`, TS2305). `Wiring.platform` admits `Container`, whose constructor is private.
- **No module for a member off the container**: a member that does not declare `@stackra/container` gets no `module` class in its manifest, since gen writes it no `module.ts` (TS2307 in `.stackra/entry`).

### Driver names (manifest change)

A port named after its member (`PlatformPushTransport` of `platform`, `RunwayProvider` of `runway`, `FiscalSigner` of `fiscal`) now also strips the rest of its name from a driver file's stem, as ADR 0263 names drivers by file prefix: `expo-push-transport.driver.ts` is `expo` (was `expo_push_transport`), `cloudflare-workers-provider.driver.ts` is `cloudflare_workers`, `cades-signer.driver.ts` is `cades`. These are the names the packages' own `DriverRegistry` stand-ins already used. A config that selected one of these drivers by its old long name selects it by the short name now; the committed manifests of `@stackra/platform`, `@stackra/runway` and `@stackra/fiscal` are regenerated.

Package schema fixes the new check found: `@stackra/analytics` destination `include` and `exclude` are optional, as `AnalyticsDestination` states (absent takes every event); `@stackra/panel`'s `pdfPage.heightMm` admits `undefined`; `@stackra/settings` stores a list of strings, as `SettingValue` allows; `@stackra/registry` states a catalogue action's `kind` and `dataClass`.

Upgrading: run `stackra gen` and commit the regenerated manifests. A library member on the `library` preset now typechecks its generated files; fix what it reports in the source gen reads.
