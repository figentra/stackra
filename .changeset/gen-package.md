---
"@stackra/gen": minor
---

Add `@stackra/gen`, the compiler of the programming model v3.1. Discovery reads a member's own source behind one host
seam over the TypeScript 7 API (`typescript/unstable/sync`) with a TypeScript 6 fallback and no ts-morph, sorted by
path: kinds from the `extends` clause, options as constants, partners from type arguments, constructor tokens,
facets, `handle` shapes, refusals and shape fields with their rules and constant defaults. From that IR it derives
every identity and writes the committed `stackra.manifest.json` (with `identity_collision`, `override_duplicate`,
`permission_unknown`, `two_declarations_in_file`, `partner_mismatch`, the `shape_*` family and the `@Renamed` lock of
`stackra gen --check`) and its `openapi.json` projection; the shape compiler (`X$`, `X$Check`, `{ input, output }` per
action and query, `registerSchemas`); `#stackra/wiring` with the `DriverRegistry` augmentation; `#stackra/module`; the
package entry barrels and the runtime entries. It ships the class-component compiler as a Babel plugin with
`classComponents()` for Vite and the `@stackra/gen/metro-transformer` hook, and `./testing` helpers for contract and
conformance tests (`loadManifest`, `previousRelease`, `expectBackwardCompatible`, `loadOpenApi`, `projectOpenApi`,
`discoverWithGen`).
