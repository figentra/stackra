/**
 * Stackra file contract:
 * Purpose: the "highlighted" demo of the web CodeBlock: highlighted lines that point at what changed.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The code shown. */
const CODE = `import { defineTheme } from "@stackra/tokens";

export const theme = defineTheme({
  name: "harbor",
  colors: { accent: "oklch(0.55 0.15 250)" },
  radius: { field: "10px" },
});`;

/** Code block: lines 3 and 5 to 6 highlighted. */
export default function Highlighted() {
  return (
    <CodeBlock
      className="w-full"
      code={CODE}
      title="theme.ts"
      language="ts"
      showLineNumbers
      highlightLines={[3, "5-6"]}
    />
  );
}
