/**
 * Stackra file contract:
 * Purpose: the "snippet" demo of the web CodeBlock: a snippet with line numbers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The code shown. */
const CODE = `export function totalOf(lines: readonly { price: number; quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}`;

/** Code block: a titled snippet with line numbers and copy. */
export default function Snippet() {
  return (
    <CodeBlock className="w-full" code={CODE} title="total-of.ts" language="ts" showLineNumbers />
  );
}
