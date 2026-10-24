# @stackra/runway

Runway format version 3 as code: the schemas of the root runway (WHERE things run and how they are packed) and of the
app and service member runways (WHAT a member needs), the topology placement check, and the readers that generated
tool configs call so no port, origin or feed URL is typed outside a `runway.yaml`.

**Tier:** `tier:lib` (`packages/developer/runway`). Entries `.` and `./node`, plus the asset paths
`./schema/{root,app,service}.json`. Depends on `@stackra/contracts`, `@stackra/validation`, zod and yaml.

## What is here

| Entry       | Symbol                                                                                  | Use                                                                         |
| ----------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `.`         | `baseUrlOf(member)`                                                                     | a member's dev origin: the generated Playwright `baseURL`                   |
| `.`         | `devPorts(member)`                                                                      | dev origin, port, host and Electron dev ports: the generated Electron entry |
| `.`         | `updateFeed(member)`                                                                    | the desktop update feed of the build's environment, or `null` in dev        |
| `.`         | `parseRunway(kind, document, source?)`                                                  | check a parsed runway against its version 3 schema                          |
| `.`         | `checkPlacement(root, members)`                                                         | every topology placement failure, for `stackra validate`                    |
| `.`         | `runwayJsonSchema(kind)`                                                                | the JSON Schema the committed `schema/<kind>.json` files hold               |
| `.`         | `RunwayKind`, `RunwayEnvironment`, `TopologyMode`, `RequirementEngine`, `CacheEviction` | enums                                                                       |
| `.`         | `RunwayInvalidError`, `RunwayUnresolvedError`                                           | errors                                                                      |
| `./node`    | `definesFor(member, environment)`                                                       | the bundler `define` map: public vars and the injected runway facts         |
| `./node`    | `devServer(member)`                                                                     | the Vite `server` block from the dev facts                                  |
| `./node`    | `readRunway(file, kind)`                                                                | read, YAML-parse and check one runway file                                  |
| `./schema/` | `root.json`, `app.json`, `service.json`                                                 | `$schema: "@stackra/runway/schema/app.json"` in a runway file               |

The old `./ports` entry is folded into `.` and the old `./vite` entry into `./node` (ADR 0127, 2026-10-24 note).

## The two files

A member runway states what the member needs: `requires` (an engine ADR 0227 allows, and a `reason` when
`dedicated`), secret names, `health`, its release block, and per environment its port, vars, config values and sizes.
It never holds `member`, `deployable`, `isolate`, `group`, `cpu`, `memory` or `instances`; those fail the schema. The
root runway states where members run: providers, destinations, shared pools, defaults and each environment's
`topology`. In a grouped environment every service member sits in exactly one group, or in the `default` group;
`checkPlacement` reports what is not.

```ts
import { checkPlacement } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

const root = readRunway("runway.yaml", "root");
const issues = checkPlacement(root, ["commerce", "notifications"]); // [] when every member is placed
```

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

The zod schemas in `src/core/constants/` are the source; `schema/<kind>.json` is `runwayJsonSchema(kind)` written out
with two-space indentation. A test fails when they differ, so regenerate the three files with the schema change.
