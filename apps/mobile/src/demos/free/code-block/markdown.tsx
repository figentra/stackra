/**
 * Stackra file contract:
 * Purpose: the "markdown" demo of the native CodeBlock: markdown notes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { MarkdownViewer, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_BLOCK_DEMO_KEYS } from "#src/demos/free/code-block/code-block-demo-keys.constant";

/** The demo's keys. */
const K = CODE_BLOCK_DEMO_KEYS.demo_free.code_block.markdown;

/** Release notes written in Markdown. */
export default function Markdown() {
  const t = useCatalogueText(MESSAGES.en);
  return <MarkdownViewer source={t(K.source)} />;
}
