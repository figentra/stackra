/**
 * Stackra file contract:
 * Purpose: `plainTextOf`, the text of a React label when it is plain text (a string or a number), else `undefined`:
 *          how a shortcut-aware component names its action from its children.
 * Boundary: pure.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { ReactNode } from "react";

/**
 * The plain text of `node`.
 *
 * @example
 * plainTextOf("Save"); // "Save"
 */
export function plainTextOf(node: ReactNode): string | undefined {
  return typeof node === "string" || typeof node === "number" ? String(node) : undefined;
}
