/**
 * Stackra file contract:
 * Purpose: the web `MarkdownViewer`: the safe Markdown subset as React elements (headings from h2, paragraphs, lists,
 *          quotes, code blocks, bold, italic, inline code and links), each block taking its direction from its own
 *          first letter so mixed English and Arabic notes read right.
 * Boundary: never sets HTML; unsafe link targets are plain text; external links open in a new tab without opener.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); STA-1371.
 */
import { cn } from "@heroui/react";
import { Fragment, type ReactElement } from "react";

import { isAbsoluteUrl } from "#core/functions/is-absolute-url.function";
import { markdownBlocksOf } from "#core/functions/markdown-blocks-of.function";
import type { MarkdownBlock } from "#core/types/markdown-block.type";
import { markdownInlineOf } from "#core/functions/markdown-inline-of.function";
import type { MarkdownInline } from "#core/types/markdown-inline.type";
import { CodeBlock } from "#react/code-block/code-block";
import type { MarkdownViewerProps } from "#react/code-block/markdown-viewer.props";

/** One inline run as its element. */
function runOf(run: MarkdownInline): ReactElement {
  switch (run.kind) {
    case "strong": {
      return <strong>{run.text}</strong>;
    }
    case "emphasis": {
      return <em>{run.text}</em>;
    }
    case "code": {
      return (
        <code dir="ltr" className="rounded bg-default/60 px-1 font-mono text-[0.9em]">
          {run.text}
        </code>
      );
    }
    case "link": {
      return (
        <a
          href={run.href}
          className="text-link underline underline-offset-2"
          {...(run.href && isAbsoluteUrl(run.href)
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {run.text}
        </a>
      );
    }
    default: {
      return <span>{run.text}</span>;
    }
  }
}

/** A line's inline runs. */
function Inline({ text }: { readonly text: string }): ReactElement {
  return (
    <>
      {markdownInlineOf(text).map((run, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- runs are cut from the text in order and may repeat; their place is their identity
        <Fragment key={index}>{runOf(run)}</Fragment>
      ))}
    </>
  );
}

/** Heading classes by level (h2 to h4: the page owns h1). */
const HEADING = [
  "text-xl font-semibold",
  "text-lg font-semibold",
  "text-base font-semibold",
] as const;

/** One block as its element. */
function blockOf(block: MarkdownBlock): ReactElement {
  switch (block.kind) {
    case "heading": {
      const Tag = (["h2", "h3", "h4"] as const)[block.level - 1] ?? "h4";
      return (
        <Tag dir="auto" className={cn("m-0", HEADING[block.level - 1])}>
          <Inline text={block.text} />
        </Tag>
      );
    }
    case "list": {
      const Tag = block.isOrdered ? "ol" : "ul";
      return (
        <Tag
          dir="auto"
          className={cn(
            "m-0 flex flex-col gap-1 ps-5",
            block.isOrdered ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item, position) => (
            // oxlint-disable-next-line react/no-array-index-key -- list items may repeat; their place is their identity
            <li key={position}>
              <Inline text={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "quote": {
      return (
        <blockquote dir="auto" className="m-0 border-s-2 border-separator ps-3 text-muted">
          <Inline text={block.text} />
        </blockquote>
      );
    }
    case "code": {
      return (
        <CodeBlock code={block.code} {...(block.language ? { language: block.language } : {})} />
      );
    }
    default: {
      return (
        <p dir="auto" className="m-0">
          <Inline text={block.text} />
        </p>
      );
    }
  }
}

/** Markdown as the design system's text. */
export function MarkdownViewer({ source, className }: MarkdownViewerProps): ReactElement {
  return (
    <div
      data-slot="markdown-viewer"
      className={cn("flex flex-col gap-3 text-sm leading-relaxed", className)}
    >
      {markdownBlocksOf(source).map((block, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- blocks are cut from the source in order and may repeat; their place is their identity
        <Fragment key={index}>{blockOf(block)}</Fragment>
      ))}
    </div>
  );
}
