# @stackra/gen

The Stackra compiler. Gen reads a member's source through the TypeScript compiler API, derives every identity and
locks it in the committed `stackra.manifest.json`, compiles shape classes to zod, writes the container wiring, the
member module and the entries, and compiles class components to function components.

**Tier:** `tier:lib` (`packages/developer/gen`). Entries `.`, `./node`, `./testing` and the `./metro-transformer` tool
hook (ADR 0127, 2026-10-24 note). Depends on `@stackra/contracts`, `@stackra/errors`, `@stackra/money`, `typescript`
7.0.2 (with 6.0.3 as `typescript6`, the fallback host) and `@babel/core`. It folds the old `ir` and `source` packages:
the committed manifest is the IR, and source is read behind one host seam, never through ts-morph.

## What is here

| Entry                 | Symbol                                                                       | Use                                                      |
| --------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `.`                   | `generateMember`                                                             | every file of a member from its IR, or none on an error  |
| `.`                   | `buildManifest`, `checkIdentityLock`, `compareManifests`                     | identities, the `@Renamed` lock, backward compatibility  |
| `.`                   | `emitSchemas`, `jsonSchemaOf`                                                | the shape compiler (`#stackra/schemas/<module>`)         |
| `.`                   | `emitWiring`, `emitMemberModule`, `emitPackageEntries`, `emitRuntimeEntries` | `#stackra/wiring`, `#stackra/module`, `.stackra/entry/*` |
| `.`                   | `openApiOf`                                                                  | `openapi.json`, the projection of the manifest           |
| `.`                   | `actionKey`, `eventName`, `permissionKey`, `modelKey`, `tableName`, ...      | the identity formulas of ADR 0294 decision 20            |
| `./node`              | `generate`                                                                   | one run: write, or `{ check: true }` for `--check`       |
| `./node`              | `discoverMember`, `openHost`                                                 | discovery on TypeScript 7, falling back to TypeScript 6  |
| `./node`              | `classComponents`                                                            | the Vite plugin of the class-component pass              |
| `./node`              | `compileClassComponents`, `classComponentsPlugin`                            | the pass for tsdown and other Babel hosts                |
| `./metro-transformer` | `transform`, `getCacheKey`                                                   | Metro's `babelTransformerPath`                           |
| `./testing`           | `loadManifest`, `previousRelease`, `expectBackwardCompatible`                | the manifest contract test                               |
| `./testing`           | `loadOpenApi`, `projectOpenApi`                                              | `openapi.json` is the manifest's projection              |
| `./testing`           | `discoverWithGen`                                                            | the Explorer conformance test                            |

## A run

```ts
import { generate } from "@stackra/gen/node";

const { errors, changed } = await generate("services/commerce", { check: true });
```

Gen sorts files by path, reads each class's kind from its `extends` clause (`extends Schema`, `Action({ key })`,
`Model.with(...)`, `Page.of(X)`, `Driver(Port)`, or a class of the member), its options as constants, its partner from
the heritage type argument (`Policy<Order>`, `Extension<Point["slot"]>`), and its constructor parameter types as
tokens. A dependency is described by its committed manifest, never by its `.d.ts`. Every refusal carries a
snake_case code, a position and the fix; when there is one, nothing is written.

## The contract test

```ts
import { expectBackwardCompatible, loadManifest, previousRelease } from "@stackra/gen/testing";

it("only adds to the last release", async () => {
  expectBackwardCompatible(
    await previousRelease("@acme/loyalty-kit"),
    await loadManifest("./stackra.manifest.json"),
  );
});
```

## Class components

`class Counter extends Component<CounterProps>` (with `Component` from `#stackra/ui`) compiles to
`function Counter(props: CounterProps)`: fields become state, `use*` fields hooks, methods functions, `mount()` and
`unmount()` one effect, `render()` the body. The generated Vite config puts `classComponents()` first; the generated
Metro config sets `babelTransformerPath` to `@stackra/gen/metro-transformer`.

## Not here

Per-target outputs land with the package that owns them: clients, routes and navigation, panels and resources, flags,
settings, i18n keys, the Encore app, tool configs, and `EntitySchema` and migrations (the data wave).
