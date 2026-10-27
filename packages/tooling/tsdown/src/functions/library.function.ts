/**
 * Stackra file contract:
 * Purpose: `library()`, the one tsdown preset every library's `tsdown.config.ts` calls: ESM only as `dist/*.mjs` +
 *          `.d.mts` (ADR 0025), maps, sourcemaps, clean dist, tree-shaking; the optional decorators flag turns on the
 *          legacy-decorator transform for the DI tier.
 * Boundary: builds the configuration object; it does not run the build.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { defineConfig, type UserConfig } from "tsdown";

import type { LibraryOptions } from "../types/library-options.type.ts";

const DECORATOR_CONFLICT = /`transform\.decorator`/;

/** The function form of `UserConfig["inputOptions"]`, which tsdown shallow-merges. */
type InputOptionsFn = Extract<
  NonNullable<UserConfig["inputOptions"]>,
  (...args: never[]) => unknown
>;

/**
 * Rolldown input options hook that adds the legacy decorator transform and suppresses the expected config conflict.
 * Rolldown reports CONFIGURATION_FIELD_CONFLICT when both tsconfig and inputOptions set `transform.decorator`,
 * but this is safe and expected here since we pair with `@stackra/typescript-config/decorators`.
 *
 * tsdown shallow-merges `inputOptions`, so the function form is required to add `transform.decorator`
 * without dropping the `target` / `define` / `inject` tsdown already derived.
 */
const withDecorators: InputOptionsFn = (input) => ({
  ...input,
  transform: {
    ...input.transform,
    decorator: { legacy: true, emitDecoratorMetadata: false },
  },
  onLog: (level, log, defaultHandler) => {
    if (log.code === "CONFIGURATION_FIELD_CONFLICT" && DECORATOR_CONFLICT.test(log.message)) return;
    if (input.onLog) input.onLog(level, log, defaultHandler);
    else defaultHandler(level, log);
  },
});

/**
 * Build configuration for a TypeScript library using tsdown + rolldown.
 *
 * Produces ESM output with declaration files, sourcemaps, clean dist, and tree-shaking enabled.
 * By default, builds a single `src/index.ts` barrel; pass `entries` to build subpath exports.
 *
 * @param entries - Map of output names to source entry points. Default: `{ index: "src/index.ts" }`.
 *        Example: `{ index: "src/index.ts", react: "src/react/index.ts" }`.
 * @param options - Build options (decorator support, external packages).
 * @returns the tsdown configuration object, ready to be the default export of `tsdown.config.ts`.
 * @example
 * export default library(); // src/index.ts → dist/index.mjs + index.d.mts
 * @example
 * export default library({ index: "src/index.ts", react: "src/react/index.ts" }); // subpath exports
 * @example
 * export default library(undefined, { decorators: true }); // DI tier (legacy decorators, no metadata)
 */
export function library(
  entries: Record<string, string> = { index: "src/index.ts" },
  options: LibraryOptions = {},
) {
  return defineConfig({
    entry: entries,
    format: ["esm"],
    fixedExtension: true, // ADR 0025: dist/*.mjs + .d.mts, whatever the package "type"
    platform: "neutral",
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    ...(options.external ? { external: options.external } : {}),
    ...(options.decorators ? { inputOptions: withDecorators } : {}),
  });
}
