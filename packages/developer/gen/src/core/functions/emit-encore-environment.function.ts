/**
 * Stackra file contract:
 * Purpose: `emitEncoreEnvironment`, a service's Encore environment file (`stackra-encore/<member>/environment.ts`): it
 *          sets `STACKRA_ENVIRONMENT` from Encore's `appMeta().environment` through `runningEnvironment` of
 *          `@stackra/app/server`, before any generated Encore file loads the server app. Nothing else sets the variable
 *          on a deployed Encore service, so without it a production service booted as `dev` and kept dev-only drivers
 *          (the memory action stores); now a deployed one runs as `preview`, `staging` or `production`, and an unknown
 *          one fails boot (STA-2798).
 * Boundary: pure; written for every service that runs from the generated server entry (not a v2 service with an
 *           authored main) and for no other layout. The Encore files import it first
 *           (`encoreFirstImports`). `encore run` and `encore test` keep the declared value, so local runs are unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: the generated Encore app) and 0124 (no Encore in a service); ADR 0266
 *                     (decision 2); STA-2798.
 */
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore environment file of a service, or undefined for a package, an app or a v2 service.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitEncoreEnvironment(ir)?.path; // "stackra-encore/shop/environment.ts"
 */
export function emitEncoreEnvironment(ir: MemberIR): GeneratedFile | undefined {
  // A v2 service runs from its authored main, not the generated server entry (STA-344), so it gets none.
  if (ir.layout !== "service" || ir.authoredMain === true) return undefined;
  const header = generatedHeader({
    from: "the service layout",
    purpose: `the running environment of ${ir.package}: STACKRA_ENVIRONMENT from Encore's report, before the app boots.`,
    boundary:
      "imported first by every generated Encore file here; throws (failing the process) when a deployed environment " +
      "declares dev or test, or nothing tells the environment.",
    runtime: "node",
  });
  return {
    path: `${encoreServiceFolder(ir.member)}/environment.ts`,
    content: [
      header,
      'import { runningEnvironment } from "@stackra/app/server";',
      'import { appMeta } from "encore.dev";',
      "",
      "// A deployed Encore service sets no STACKRA_ENVIRONMENT; Encore's own report says which environment this is.",
      'const running = runningEnvironment(process.env["STACKRA_ENVIRONMENT"], appMeta().environment);',
      'if (running !== undefined) process.env["STACKRA_ENVIRONMENT"] = running;',
      "",
    ].join("\n"),
  };
}
