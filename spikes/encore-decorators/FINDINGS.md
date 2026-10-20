# Spike: Encore.ts + legacy decorators (throwaway, do not merge)

Encore CLI v1.58.6, pnpm 12.6, node 24, TypeScript 5.9, vitest 3.2, tsdown 0.15 (preset uses `transform.decorator legacy`).
Container is a ~60-line stand-in (`packages/di/src/index.ts`: @Injectable/@Inject(token)/@Module/@Controller/@Get, WeakMap metadata, no reflect-metadata). It is NOT the Figentra OS container.

## Results

| Case | What | `encore run` + curl | `encore test` |
|---|---|---|---|
| A | decorators in the service's own .ts (`a/`), DI resolved in `api()` handler | 200 `{"msg":"hi x @t0"}` | pass |
| B | decorated code in a workspace package built by tsdown (`decorators: true`) to `dist/index.mjs`, imported by service (`b/`) | 200 | pass |
| C | `@Controller/@Get` class + hand-written `export const getItem = api(..., req => container.get(ItemController).get(req))` (`c/`) | 200 `{"id":"7","name":"item-7"}` | pass |

Encore static analysis accepted all three: `api()` stays a top-level `export const`; the handler body may call anything, including a module-level container.

`encore build docker`: INCONCLUSIVE. Default (amd64) ran >10 min at ~90% CPU with no output and no children; retry with `--arch arm64 -v` was killed at the 500s cap, also silent. Not reproduced as a decorator failure; likely a local/cross-compile/base-image issue. Needs a retry in CI (linux runner) before final sign-off.

## Required config
- `experimentalDecorators: true` in the tsconfig Encore and vitest see (the app root tsconfig). Removing it breaks `encore run` and `encore test` for every case, including B/C, because the *consuming* service files still contain decorators. Error: "Parameter decorators only work when experimental decorators are enabled" (esbuild).
- `useDefineForClassFields`: both true and false worked for constructor-parameter `@Inject`. Field/property decorators not tested; keep `false` to match legacy semantics.
- No `emitDecoratorMetadata` needed or available (esbuild); explicit tokens avoid it.
- Package side: tsdown with `inputOptions.transform.decorator = { legacy: true, emitDecoratorMetadata: false }`. Emits a harmless CONFIGURATION_FIELD_CONFLICT warning if tsconfig also sets experimentalDecorators. `fixedExtension: true` is needed to get `.mjs` (otherwise `.js` under `type: module` in this tsdown version).
- Built package is already de-sugared, so a consumer can import it with no extra flags; only its own decorated files need the flag.

## Gotchas / risks
- `encore test` / `encore run` run the project's package manager install. With pnpm 12 the install fails on esbuild's postinstall (`ERR_PNPM_IGNORED_BUILDS`) unless `allowBuilds: { esbuild: true }` is in pnpm-workspace.yaml. In the real monorepo this must be allowed in the root workspace.
- Encore needs `test` script in package.json (`encore test` otherwise: "application does not define any tests").
- Encore must resolve `@spike/di` from node_modules (workspace link to built `dist`): packages must be built BEFORE `encore run/test` (turbo dependsOn `^build`). Editing package src does not hot-rebuild.
- Spike used an own pnpm workspace in the subfolder; I did not test Encore inside the main monorepo (catalogs, root lockfile, `services/*` layout) nor the `~encore` import ban in packages.
- Not tested: generator, Pub/Sub `Subscription` and `CronJob` declarations, auth handler, SQLDatabase, multiple services, tracing of handlers invoked via container (Encore tracing wraps the api() handler, so should be fine).
- Docker build unverified (above).

## Recommendation: GO WITH CONSTRAINTS
DI-first + codegen is viable: legacy decorators and a built-package container work under Encore's bundler and test runner, and generated static `api()` declarations are accepted.
Constraints: (1) `experimentalDecorators: true` in app root tsconfig; (2) explicit tokens only, no design:paramtypes; (3) generated files must keep `api()/Subscription/CronJob` as top-level statically analyzable declarations; (4) build packages before Encore; (5) pnpm `allowBuilds` for esbuild; (6) re-run the docker build on a Linux CI runner before committing to the design.
