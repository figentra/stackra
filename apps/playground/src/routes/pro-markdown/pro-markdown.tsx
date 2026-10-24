/**
 * Stackra file contract:
 * Purpose: the page of the Markdown route: `@stackra/ui-pro`'s Markdown rendering a document with a heading, a paragraph
 *          with emphasis and inline code, a list, a quotation and a fenced code block, and StreamMarkdown rendering a
 *          reply that is still arriving, cut off part-way through a block.
 * Boundary: presentation only; the text is local and fixed, so the streaming reply does not change while the page is
 *          open. The rendered headings start at level 3, below the page's own, so the outline stays in order.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra/ui-pro/react";

import { ProMarkdownRoute } from "#src/routes/pro-markdown/pro-markdown.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-markdown.*` keys.
const STRINGS = {
  documentTitle: `${ProMarkdownRoute.title} · Stackra Playground`,
  intro:
    "Markdown for an assistant's reply: headings, emphasis, lists, quotations and code. A streaming reply is repaired while it is cut off part-way through a block.",
  document: "A document",
  streaming: "A reply still streaming",
} as const;

const DOCUMENT = `### Markdown in a reply

This uses **react-markdown** with *block-level* memoisation, so a long reply stays fast.

- Headings, lists and links
- Inline \`code\` snippets
- Fenced code blocks

\`\`\`ts
export type ChatStatus = "ready" | "streaming";
\`\`\`

> A reply can carry rich formatting without tying the page to an SDK.
`;

const STREAMING = `### Streaming reply

Streamdown repairs unfinished Markdown, so a half-typed block stays readable:

- A list that has started
- A **bold phrase that is not closed`;

/** The Markdown page. */
export function ProMarkdown() {
  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProMarkdownRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="document-heading" className="grid max-w-2xl gap-3">
        <h2 id="document-heading" className="type-h2">
          {STRINGS.document}
        </h2>
        <UiPro.Markdown>{DOCUMENT}</UiPro.Markdown>
      </section>
      <section aria-labelledby="streaming-heading" className="grid max-w-2xl gap-3">
        <h2 id="streaming-heading" className="type-h2">
          {STRINGS.streaming}
        </h2>
        {/* The reply here is fixed, so its words are not faded in: the fade would play once at load and show nothing. */}
        <UiPro.StreamMarkdown isStreaming animated={false}>
          {STREAMING}
        </UiPro.StreamMarkdown>
      </section>
    </article>
  );
}
