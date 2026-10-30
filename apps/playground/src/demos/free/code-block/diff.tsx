/**
 * Stackra file contract:
 * Purpose: the "diff" demo of the web CodeBlock: a diff with inserted and deleted lines.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The code shown: `+` lines are inserted, `-` lines deleted. */
const CODE = ` export function totalOf(lines: readonly Line[]): number {
-  let sum = 0;
-  for (const line of lines) sum += line.price * line.quantity;
-  return sum;
+  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
 }`;

/** Code block: a diff; the copy button copies the new version. */
export default function Diff() {
  return <CodeBlock className="w-full" code={CODE} title="total-of.ts" language="ts" isDiff />;
}
