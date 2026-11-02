/**
 * Stackra file contract:
 * Purpose: `loadWithVite(file, root)`, the module loader `stackra gen` hands gen: it imports a member's source through
 *          Vite's module runner in the member's folder, so classes that carry decorators (a resource and the actions
 *          and schemas it names) load where Node's type stripping refuses them.
 * Boundary: the runner options of `stackra console` (the house legacy decorator transform, no config file, silent),
 *           plus `@stackra/*` packages inlined and resolved through the `@stackra/source` condition, as in the vitest
 *           preset: gen runs before any build, so a linked package's `dist` may not exist yet. Other packages stay
 *           external. Each call is one runner, and gen calls it once per run.
 * Runtime: node
 * Governing contract: ADR 0307 (rule 5: gen records each resource's tree); ADR 0506 (decision 6: the console entry
 *                     loads the same way); STA-1947.
 */
import { runnerImport } from "vite";

/** The resolve conditions of the vitest preset's server side: a workspace package's source first. */
const CONDITIONS = ["@stackra/source", "node", "development|production"];

/**
 * Imports `file` for the member at `root`.
 *
 * @example
 * const { describeAll } = await loadWithVite("/repo/packages/x/.stackra/cache/resource-trees.ts", "/repo/packages/x");
 */
export async function loadWithVite(file: string, root: string): Promise<Record<string, unknown>> {
  const { module } = await runnerImport<Record<string, unknown>>(file, {
    root,
    configFile: false,
    logLevel: "silent",
    // runnerImport runs in its own `inline` environment, which externalizes every bare import; a Stackra package is
    // inlined instead, so its source loads (with its decorators) and the resource and gen share one kind registry.
    environments: { inline: { resolve: { conditions: CONDITIONS, noExternal: [/^@stackra\//] } } },
    oxc: { decorator: { legacy: true, emitDecoratorMetadata: false } },
  });
  return module;
}
