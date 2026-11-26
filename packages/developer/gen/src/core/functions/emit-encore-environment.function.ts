/**
 * Stackra file contract:
 * Purpose: `emitEncoreEnvironment`, a service's Encore environment file (`stackra-encore/<member>/environment.ts`): it
 *          hands Encore's `appMeta().environment` (name, type, cloud) to `provideRuntimeEnvironment` of
 *          `@stackra/app/server`, so the server `createApp` derives the running Stackra environment
 *          (`STACKRA_ENVIRONMENT`) where the deployment cannot set it (Encore Cloud has no plain environment
 *          variables) and refuses `dev` or `test` on a deployed runtime. A deployed service therefore never boots as
 *          `dev`, and an action there with no `AuditTrail` bound fails closed (ADR 0212 decisions 1 and 4, STA-1571).
 * Boundary: pure; written for every service that gets a server entry (a root module, no authored `src/main.ts`), the
 *           services whose Encore files import the app. Every generated Encore file imports it first
 *           (`encoreSetupImports`), ahead of the server app. It names no member code, only `encore.dev` and
 *           `@stackra/app/server`.
 * Runtime: isomorphic
 * Governing contract: ADR 0091 (decision 2: gen emits the whole Encore app) and 0124 (no Encore in a service); ADR
 *                     0212 (decisions 1 and 4), STA-1571.
 */
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generatedHeader } from "#core/functions/generated-header.function";
import { rootModuleOf } from "#core/functions/root-module-of.function";
import type { GeneratedFile } from "#core/types/generated-file.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The Encore environment file of a service, or undefined for a package, an app or a service with no server entry.
 *
 * @param ir - the member read by discovery.
 * @example
 * emitEncoreEnvironment(ir)?.path; // "stackra-encore/shop/environment.ts"
 */
export function emitEncoreEnvironment(ir: MemberIR): GeneratedFile | undefined {
  // The server entry's rule: a service with a root module, unless it runs from an authored src/main.ts (STA-344).
  if (ir.layout !== "service" || ir.authoredMain === true || rootModuleOf(ir) === undefined)
    return undefined;
  const header = generatedHeader({
    from: "the service layout",
    purpose: `where Encore runs ${ir.package}, handed to the server app before it boots.`,
    boundary:
      "provides the runtime environment only; `createApp` derives `STACKRA_ENVIRONMENT` from it and refuses dev or " +
      "test on a deployed runtime.",
    runtime: "node",
  });
  return {
    path: `${encoreServiceFolder(ir.member)}/environment.ts`,
    content: [
      header,
      'import { provideRuntimeEnvironment } from "@stackra/app/server";',
      'import { appMeta } from "encore.dev";',
      "",
      "// The server app reads it when it builds its configuration; every generated Encore file imports this one first.",
      "provideRuntimeEnvironment(appMeta().environment);",
      "",
    ].join("\n"),
  };
}
