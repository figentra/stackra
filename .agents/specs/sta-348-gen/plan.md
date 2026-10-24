# Plan: `@stackra/gen` wave 2

**Spec**: `.agents/specs/sta-348-gen/spec.md`

## Design

- **`.` (core, isomorphic, pure)**: the IR types (`MemberIR`, `DeclaredClass`, `ShapeIR`, `FieldIR`, `TypeDesc`, ...),
  the identity helpers (`actionKey`, `eventName`, `permissionKey`, `modelKey`, `tableName`, `portKey`, `configKeyOf`,
  `folderKey`, `toolName`, `driverName`, `deriveEndpoint`), `buildManifest` (identity checks included),
  `checkIdentityLock`, `compareManifests`, `emitSchemas`, `jsonSchemaOf`, `emitWiring`, `emitMemberModule`,
  `emitPackageEntries`, `emitRuntimeEntries`, `openApiOf`, `rootModuleOf` and `generateMember`, which returns every file
  or, on any error, none.
- **`./node`**: the host seam (`TsHost` over `openTsgoHost` and `openTs6Host`, chosen by `openHost`),
  `createSourceReader` (kinds from the `extends` clause, options as constants, partners from type arguments,
  constructor tokens, facets made by `createDecorator`, `handle`, refusals, statics, traits, shapes from the declared
  type node then the checker, enums in source order, file exports), `readMemberFacts`, `readDependencyManifests`,
  `discoverMember`, `generate` (write or `--check`), and the class-component compiler (`classComponentsPlugin`,
  `compileClassComponents`, `classComponents()` for Vite).
- **`./metro-transformer`**: `transform` (the pass with `retainLines`, then Expo's or React Native's transformer) and
  `getCacheKey`.
- **`./testing`**: `loadManifest`, `loadOpenApi`, `previousRelease` (git tags), `expectBackwardCompatible`,
  `projectOpenApi`, `discoverWithGen`.
- The platform set in the wiring is derived (every constructor token from a `@stackra/*` package), never listed.
- A kind base is recognised by name only when declared in a `@stackra/*` package; a dependency's declaration file is
  read only for a kind (`X_base: ConfigClass<...>`), an inherited field or a constant.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/errors`, `@stackra/money`, `@babel/core`, `typescript`
  (7) and `typescript6` only; no app, service or `encore.dev`. `@stackra/container`, `@stackra/config` and
  `@stackra/validation` are test-only conformance dependencies (the generated code imports them; gen does not).
- Versions: catalogs and `workspace:*` only; `typescript6` needs its catalog entry (owner).
- Naming: v3.1; `<name>.<kind>.ts`; one declaration per file; refusal codes snake_case.
- Secrets: none; a config's schema never reaches a wire file.
- Shortcut recorded: `readMemberFacts` reads the static `define*` call by pattern until a tool section needs the syntax
  tree (STA-339).
