/**
 * Stackra file contract:
 * Purpose: `componentBeside`, the component that draws a route or a block on one runtime, bound by name: the value
 *          export of `<stem>.tsx` (browser) or `<stem>.native.tsx` (native) in the class's own folder.
 * Boundary: pure; reads the file exports discovery recorded. No component file means nothing to draw on that runtime.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 14: app groups, one folder per route and block); ADR 0270 (decision 3: a
 *                     block's component per target).
 */
import type { ClassRef } from "#core/types/class-ref.type";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The component of the class file `file` named `stem` on `runtime`.
 *
 * @example
 * componentBeside(ir, "src/blocks/testimonials/testimonials.block.ts", "testimonials", "native");
 * // { name: "Testimonials", from: "#blocks/testimonials/testimonials.native" }
 */
export function componentBeside(
  ir: MemberIR,
  file: string,
  stem: string,
  runtime: "browser" | "native",
): ClassRef | undefined {
  const folder = file.slice(0, file.lastIndexOf("/"));
  const path = `${folder}/${stem}${runtime === "native" ? ".native" : ""}.tsx`;
  const exports = ir.files.find((candidate) => candidate.file === path);
  const name = exports?.names.find((candidate) => !candidate.typeOnly)?.name;
  return exports === undefined || name === undefined
    ? undefined
    : { name, from: exports.importPath };
}
