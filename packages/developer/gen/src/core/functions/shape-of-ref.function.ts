/**
 * Stackra file contract:
 * Purpose: `shapeOfRef`, the member's shape a manifest `{ $ref: "#/schemas/<module>.<Name>" }` names, so every
 *          emitter that reads an action entry's input or output resolves the same shape.
 * Boundary: pure; reads `ir.shapes` only. A ref the member does not declare (a hosted package's) is undefined.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20); ADR 0305 (one shape per file); STA-2025; STA-2063.
 */
import type { MemberIR } from "#core/types/member-ir.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/**
 * The shape `value` refers to, or undefined when it is no ref or names no shape of `ir`.
 *
 * @param ir - the member read by discovery.
 * @param value - an entry's `input` or `output` as the manifest records it.
 * @example
 * shapeOfRef(ir, { $ref: "#/schemas/orders.CancelOrderInput" })?.name; // "CancelOrderInput"
 */
export function shapeOfRef(ir: MemberIR, value: unknown): ShapeIR | undefined {
  const ref =
    typeof value === "object" && value !== null ? (value as { $ref?: unknown }).$ref : undefined;
  const target = /^#\/schemas\/([^.]+)\.(.+)$/.exec(typeof ref === "string" ? ref : "");
  return target === null
    ? undefined
    : ir.shapes.find((shape) => shape.module === target[1] && shape.name === target[2]);
}
