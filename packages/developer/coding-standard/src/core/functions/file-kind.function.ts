/**
 * Stackra file contract:
 * Purpose: `fileKind`, the kind suffix of a class-kind file (`cancel-order.action.ts` is `action`), so a rule knows
 *          which base class the file's class must extend.
 * Boundary: pure; reads the file name only. Only `.ts` files carry a class kind: `.tsx` files are components and
 *           test files (`.test.ts`) never match.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rules R1 and R3); ADR 0305 (one declaration per file).
 */
import { baseName } from "#core/functions/base-name.function";

const KIND_FILE = /^[^.]+\.(?<kind>[a-z][a-z0-9]*(?:-[a-z0-9]+)*)\.ts$/;

/**
 * Returns the kind suffix of `filename`, or `undefined` when the name is not `<stem>.<kind>.ts`.
 *
 * @example
 * ```ts
 * fileKind("src/modules/orders/actions/cancel-order.action.ts"); // "action"
 * fileKind("src/modules/orders/actions/__tests__/cancel-order.action.test.ts"); // undefined
 * ```
 */
export function fileKind(filename: string): string | undefined {
  return KIND_FILE.exec(baseName(filename))?.groups?.["kind"];
}
