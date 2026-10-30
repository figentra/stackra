/**
 * Stackra file contract:
 * Purpose: the "shell" demo of the web CodeBlock: shell commands with a prompt that stays out of the copy.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { CodeBlock } from "@stackra/ui/react";

/** The commands shown. */
const CODE = `pnpm add @stackra/ui @stackra/tokens
pnpm --filter @figentra/playground dev --port 3711`;

/** Code block: commands with a `$` prompt that is not selected or copied. */
export default function Shell() {
  return <CodeBlock className="w-full" code={CODE} language="bash" prompt="$" />;
}
