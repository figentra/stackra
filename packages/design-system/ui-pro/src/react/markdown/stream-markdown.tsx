/**
 * Stackra file contract:
 * Purpose: the web `StreamMarkdown` on HeroUI Pro's StreamMarkdown: renders Markdown that is still arriving, with
 *          `isStreaming`, `animated`, `caret` and `controls` HeroUI Pro's own; the div props pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It renders with `streamdown`,
 *          an optional peer of HeroUI Pro. HeroUI Pro ships this component on its `markdown` subpath only, so the
 *          wrapper imports it from there.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { StreamMarkdown as HeroStreamMarkdown } from "@heroui-pro/react/markdown";

import type { StreamMarkdownProps } from "#react/markdown/stream-markdown.props";

/** Renders Markdown text that is still streaming in. */
export function StreamMarkdown(props: StreamMarkdownProps) {
  return <HeroStreamMarkdown {...props} />;
}
