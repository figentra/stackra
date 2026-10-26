/**
 * Stackra file contract:
 * Purpose: loads the `./node` entry of @stackra/repo-checks from its TypeScript source for the thin wrapper scripts
 *          (validate-repository, doc-standard, catalogue-completeness, structure), so `pnpm validate` keeps running
 *          with plain `node` and no build. Node strips the types; a resolve hook retries an unresolved `#` import with
 *          `.ts`, as the bundler resolves the source (ADR 0233).
 * Boundary: registers one process-wide resolve hook that only acts on a `#` specifier Node could not find.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3: the checks live in a CLI-owned package); ADR 0233.
 */
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, next) {
    try {
      return next(specifier, context);
    } catch (error) {
      if (!specifier.startsWith("#") || error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
      return next(`${specifier}.ts`, context);
    }
  },
});

/** The `./node` entry of @stackra/repo-checks, loaded from source. */
export const checks = await import("../../packages/developer/repo-checks/src/node/index.ts");
