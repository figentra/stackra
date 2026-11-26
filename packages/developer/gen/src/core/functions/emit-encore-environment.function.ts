/**
 * Stackra file contract:
 * Purpose: `emitEncoreEnvironment`, a service's Encore environment file (`stackra-encore/<member>/environment.ts`): it
 *          hands Encore's `appMeta().environment` (name, type, cloud) to `providePlatformEnvironment` of
 *          `@stackra/app/server`, which reads the running environment through the one reader (`readEnvironment` of
 *          @stackra/config) and settles `STACKRA_ENVIRONMENT` before any generated Encore file loads the server app. A
 *          deployed Encore service sets no variable itself (Encore Cloud has no plain environment variables), so
 *          without this file it read as `dev`; now it runs as `preview`, `staging` or `production`, and `dev` declared
 *          there, a misspelt name or a self-hosted image that reports nothing fails the process (STA-2844).
 * Boundary: pure; written for every service that runs from the generated server entry (a service that declares
 *           `@stackra/app`, not a v2 service with an authored `src/main.ts`) and for no other layout. Every generated
 *           Encore file imports it first (`encoreSetupImports`). It names no member code, only `encore.dev` and
 *           `@stackra/app/server`.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: gen emits the whole Encore app) and 0124 (no Encore in a service); ADR
 *                     0296 (amendment 2026-11-26: the environment comes from the runtime only); STA-2844.
 */
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore environment file of a service, or undefined for a package, an app, a v2 service or a service that does
 * not run `@stackra/app`.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitEncoreEnvironment(ir)?.path; // "stackra-encore/shop/environment.ts"
 */
export function emitEncoreEnvironment(ir: MemberIR): GeneratedFile | undefined {
  // A v2 service runs from its authored main, not the generated server entry (STA-344), so it gets none.
  if (ir.layout !== "service" || ir.authoredMain === true) return undefined;
  const declares =
    (ir.packages ?? []).includes("@stackra/app") ||
    ir.dependencies.some((dependency) => dependency.package === "@stackra/app");
  if (!declares) return undefined;
  const header = generatedHeader({
    from: "the service layout and its @stackra/app dependency",
    purpose: `the running environment of ${ir.package}, settled from Encore's report before the server app loads.`,
    boundary:
      "imported first by every generated Encore file here; `providePlatformEnvironment` throws (failing the process) " +
      "on dev or test in a deployment, a misspelt STACKRA_ENVIRONMENT, or a platform that reports nothing.",
    runtime: "node",
  });
  return {
    path: `${encoreServiceFolder(ir.member)}/environment.ts`,
    content: [
      header,
      'import { providePlatformEnvironment } from "@stackra/app/server";',
      'import { appMeta } from "encore.dev";',
      "",
      "// Encore's report of where this runs; the one reader turns it into STACKRA_ENVIRONMENT before the app boots.",
      "providePlatformEnvironment(appMeta().environment);",
      "",
    ].join("\n"),
  };
}
