/**
 * Stackra file contract:
 * Purpose: the "snippet" demo of the native CodeBlock: a snippet with line numbers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { CodeBlock } from "@stackra/ui/native";

const CODE = `export function totalOf(lines: readonly { price: number; quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}`;

/** A titled snippet with line numbers and copy. */
export default function Snippet() {
  return <CodeBlock code={CODE} title="total-of.ts" language="ts" showLineNumbers />;
}
