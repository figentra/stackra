/**
 * Stackra file contract:
 * Purpose: the "markdown" demo of the web CodeBlock: markdown notes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { MarkdownViewer, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_BLOCK_KEYS } from "#src/demos/free/code-block/code-block-keys.constant";

/** The demo's keys. */
const K = CODE_BLOCK_KEYS.code_block;

/** Code block: release notes written in Markdown. */
export default function Markdown() {
  const t = useCatalogueText(MESSAGES.en);
  return <MarkdownViewer className="w-full" source={t(K.source)} />;
}
