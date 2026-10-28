/**
 * Stackra file contract:
 * Purpose: `surfacesOf`, the surfaces a member contributes to and the shell line it targets on each: a dependency whose
 *          committed manifest declares slots is the shell of every surface those slots sit on, and its version's major
 *          is the line (`console@3`), the `targets` the manifest's `surfaces` section and the bundle manifest carry.
 * Boundary: pure; reads `ir.dependencies` only. A member's own slots make it a shell, not a target, so they are not
 *           read. One entry per surface and shell package, sorted; a conflict between two shells is `checkSurfaces`'.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decisions 4 and 5: the bundle declares its shell line; one line during development);
 *                     ADR 0438 (slots); app-shells-edge-and-extension.md 4.1 (`shell:<surface>:<major>`), 4.2.
 */
import type { MemberIR } from "#core/types/member-ir.type";
import type { SurfaceTarget } from "#core/types/surface-target.type";

/**
 * The surfaces `ir` targets.
 *
 * @example
 * surfacesOf(ir); // [{ surface: "console", targets: "console@3", shell: "@os/console-shell" }]
 */
export function surfacesOf(ir: MemberIR): SurfaceTarget[] {
  const found = new Map<string, SurfaceTarget>();
  for (const { package: shell, manifest } of ir.dependencies) {
    const slots = manifest["slots"];
    const major = /^(\d+)\./.exec(manifest.version)?.[1];
    if (!Array.isArray(slots) || major === undefined) continue;
    for (const slot of slots as readonly Record<string, unknown>[]) {
      const surface = slot["surface"];
      if (typeof surface !== "string" || surface === "") continue;
      found.set(`${surface} ${shell}`, { surface, targets: `${surface}@${Number(major)}`, shell });
    }
  }
  return (
    [...found.entries()]
      // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([, target]) => target)
  );
}
