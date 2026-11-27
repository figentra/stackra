/**
 * Stackra file contract:
 * Purpose: `runsServerApp(ir)`, whether a member declares `@stackra/app` (in its package.json or as a dependency with a
 *          manifest): the services whose server app reads the running environment, and so need the generated
 *          `environment.ts` (STA-2844).
 * Boundary: pure; reads the declared packages and dependencies only. Shared by `emitEncoreEnvironment` and
 *           `checkServerEnvironment`, so the file and its refusals agree on which services run the app.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (amendment 2026-11-26); STA-1571, STA-2844.
 */
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * Whether `ir` declares `@stackra/app`.
 *
 * @param ir - the member read by discovery.
 * @example
 * runsServerApp({ ...service, packages: ["@stackra/app"] }); // true
 */
export function runsServerApp(ir: MemberIR): boolean {
  return (
    (ir.packages ?? []).includes("@stackra/app") ||
    ir.dependencies.some((dependency) => dependency.package === "@stackra/app")
  );
}
