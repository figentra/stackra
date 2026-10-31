/**
 * Stackra file contract:
 * Purpose: `library()`, the one tsdown preset every library's `tsdown.config.ts` calls: ESM only as `dist/*.mjs` +
 *          `.d.mts` (ADR 0025), maps, sourcemaps, clean dist, tree-shaking, and a guard that fails the build when a
 *          chunk carries rolldown's `__require` shim (STA-1722); the optional decorators flag turns on the
 *          legacy-decorator transform for the DI tier.
 * Boundary: builds the configuration object; it does not run the build.
 * Runtime: node
 * Governing contract: ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { defineConfig, type UserConfig } from "tsdown";

import type { LibraryConfig } from "../types/library-config.type.ts";
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

/** A call through rolldown's `__require` shim, which throws in ESM: `__require("react")`. */
const REQUIRE_SHIM = /__require\(\s*["']([^"']+)["']\s*\)/g;

/**
 * Fails the build when a chunk calls `__require(...)`: a CommonJS dependency was bundled instead of kept external, and
 * its `require` throws for every ESM consumer (STA-1722). Declare the required package as a dependency or peer.
 */
const noRequireShim = {
  name: "stackra:no-require-shim",
  renderChunk(
    this: { error: (message: string) => never },
    code: string,
    chunk: { fileName: string },
  ) {
    const required = [...new Set([...code.matchAll(REQUIRE_SHIM)].map((match) => match[1]))];
    if (required.length > 0)
      this.error(
        `${chunk.fileName} calls require(${required.map((name) => JSON.stringify(name)).join(", ")}) through rolldown's ` +
          "__require shim, which throws under ESM: a CommonJS dependency was bundled. Declare the package that " +
          "imports it as a dependency or peer so it stays external.",
      );
    return null;
  },
};

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
): LibraryConfig {
  return defineConfig({
    entry: entries,
    format: ["esm"],
    fixedExtension: true, // ADR 0025: dist/*.mjs + .d.mts, whatever the package "type"
    platform: "neutral",
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    plugins: [noRequireShim],
    ...(options.external ? { external: options.external } : {}),
    ...(options.decorators ? { inputOptions: withDecorators } : {}),
  });
}
