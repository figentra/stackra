/**
 * Stackra file contract:
 * Purpose: `specTraceProblems(trace, prefix)`, the Done rules over a trace: every live FR and P tested, every SC naming
 *          its verification method.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import type { SpecTrace } from "../types/spec-trace.type.ts";

/**
 * Problems of a Done spec's trace.
 *
 * @param trace - the matrix from `specTrace`.
 * @param prefix - the spec folder's issue prefix, which the `@covers` tag spells.
 * @example
 * specTraceProblems(specTrace(context), "os");
 */
export function specTraceProblems(trace: SpecTrace, prefix: string): string[] {
  const tag = `${prefix.toLowerCase()}-${trace.key}`;
  const problems: string[] = [];
  for (const fr of trace.frs)
    if (!fr.tested && !fr.via.length)
      problems.push(
        `${fr.id} has no test carrying \`@covers ${tag}:${fr.id}\` (directly or via a P-###)`,
      );
  for (const p of trace.ps)
    if (!p.tested) problems.push(`${p.id} has no test carrying \`@covers ${tag}:${p.id}\``);
  for (const sc of trace.scs)
    if (!sc.method)
      problems.push(`${sc.id} names no verification method ("— verified by: unit|e2e|k6|manual")`);
  return problems;
}
