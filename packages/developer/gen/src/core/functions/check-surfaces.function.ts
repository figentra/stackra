/**
 * Stackra file contract:
 * Purpose: `checkSurfaces`, the refusal `surface_targets_conflict`: two shell dependencies put one surface on two
 *          different lines (`console@2` and `console@3`), so the member's bundle could target neither.
 * Boundary: pure; reads `surfacesOf(ir)`. Runs in the full pass beside the slot check, never in the manifest pass.
 *           Whether the edge serves the line is the registry's check at publish, not gen's.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 5: one version line); app-shells-edge-and-extension.md 15 (point 7); ADR 0294
 *                     (decision 22: a refusal carries its fix).
 */
import { surfacesOf } from "#core/functions/surfaces-of.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The surface refusals of `ir`.
 *
 * @example
 * checkSurfaces(ir).map((error) => error.code); // ["surface_targets_conflict"]
 */
export function checkSurfaces(ir: MemberIR): GenError[] {
  const bySurface = new Map<string, string[]>();
  for (const target of surfacesOf(ir))
    bySurface.set(target.surface, [
      ...(bySurface.get(target.surface) ?? []),
      `${target.targets} (${target.shell})`,
    ]);
  return [...bySurface.entries()]
    .filter(([, lines]) => new Set(lines.map((line) => line.split(" ")[0])).size > 1)
    .map(([surface, lines]) => ({
      code: "surface_targets_conflict",
      file: "package.json",
      line: 0,
      column: 0,
      subject: surface,
      message: `the ${surface} surface is on more than one shell line: ${lines.join(", ")}`,
      fix: `depend on one ${surface} shell version line, the one the OS serves`,
    }));
}
