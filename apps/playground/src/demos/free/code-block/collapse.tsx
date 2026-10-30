/**
 * Stackra file contract:
 * Purpose: the "collapse" demo of the web CodeBlock: a long file that shows its first lines and a "Show all" button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The code shown. */
const CODE = `:root {
  --accent: oklch(0.55 0.15 250);
  --radius-container: 1rem;
}

/* Cards */
.card {
  padding: 1rem;
  border-radius: var(--radius-container);
  background: var(--surface);
}

.card:hover {
  background: var(--surface-secondary);
}

/* Buttons */
.button {
  min-height: 2.5rem;
  padding-inline: 1rem;
  font-weight: 600;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}`;

/** Code block: past 12 lines it collapses behind "Show all", never an inner scrollbar. */
export default function Collapse() {
  return (
    <CodeBlock
      className="w-full"
      code={CODE}
      title="theme.css"
      language="css"
      showLineNumbers
      maxLines={12}
    />
  );
}
