/**
 * Stackra file contract:
 * Purpose: the "wrap" demo of the web CodeBlock: long lines that wrap, with a toggle in the header.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The code shown. */
const CODE = `const receipt = await client.orders.receipt({ orderId: "ord_2048", locale: "ar-SA", currency: "SAR", includeTax: true, format: "pdf" });`;

/** Code block: long lines wrap; the header button turns wrapping off and on. */
export default function Wrap() {
  return (
    <CodeBlock
      className="w-full"
      code={CODE}
      title="receipt.ts"
      language="ts"
      isWrapped
      showWrapToggle
    />
  );
}
