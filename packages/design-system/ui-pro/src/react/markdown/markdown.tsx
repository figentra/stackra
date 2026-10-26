/**
 * Stackra file contract:
 * Purpose: the web `Markdown` on HeroUI Pro's Markdown: renders a Markdown string (GitHub-flavoured, with line
 *          breaks) as styled HTML; the `components` map and the div props pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. It renders with
 *          `react-markdown`, `remark-gfm` and `remark-breaks`, optional peers of HeroUI Pro. HeroUI Pro ships this
 *          component on its `markdown` subpath only, so the wrapper imports it from there.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import { Markdown as HeroMarkdown } from "@heroui-pro/react/markdown";

import type { MarkdownProps } from "#react/markdown/markdown.props";

/** Renders Markdown text as HTML. */
export function Markdown(props: MarkdownProps) {
  return <HeroMarkdown {...props} />;
}
