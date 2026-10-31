/**
 * Stackra file contract:
 * Purpose: the native `MarkdownViewer`: the safe Markdown subset with the design system's Text (headings as headers,
 *          paragraphs, lists, quotes, code blocks, bold, italic, inline code and links that open in the browser).
 * Boundary: no HTML; only http(s) and mailto links open; a relative link stays text. Each block keeps its own
 *           direction through the platform's natural writing direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import { Fragment } from "react";
import type { ReactElement } from "react";
import { Linking, View } from "react-native";

import { isAbsoluteUrl } from "#core/functions/is-absolute-url.function";
import { markdownBlocksOf } from "#core/functions/markdown-blocks-of.function";
import { markdownInlineOf } from "#core/functions/markdown-inline-of.function";
import { Code } from "#native/code/code";
import { CodeBlock } from "#native/code-block/code-block";
import type { MarkdownViewerProps } from "#native/code-block/markdown-viewer.props";
import { Text } from "#native/text/text";

/** One inline run, as Text. */
function runOf(run: ReturnType<typeof markdownInlineOf>[number]): ReactElement {
  switch (run.kind) {
    case "strong": {
      return <Text className="font-semibold">{run.text}</Text>;
    }
    case "emphasis": {
      return <Text className="italic">{run.text}</Text>;
    }
    case "code": {
      return <Code>{run.text}</Code>;
    }
    case "link": {
      const href = run.href ?? "";
      const canOpen = isAbsoluteUrl(href) || href.startsWith("mailto:");
      return canOpen ? (
        <Text
          accessibilityRole="link"
          className="text-link underline"
          onPress={() => void Linking.openURL(href)}
        >
          {run.text}
        </Text>
      ) : (
        <Text>{run.text}</Text>
      );
    }
    default: {
      return <Text>{run.text}</Text>;
    }
  }
}

/** A line's inline runs, as nested Text. */
function inline(text: string): ReactElement[] {
  return markdownInlineOf(text).map((run, index) => (
    // oxlint-disable-next-line react/no-array-index-key -- parsed runs have no identity but their place in the line
    <Fragment key={index}>{runOf(run)}</Fragment>
  ));
}

/** Heading classes by level. */
const HEADING = [
  "text-xl font-semibold",
  "text-lg font-semibold",
  "text-base font-semibold",
] as const;

/** One block, as the design system's text. */
function blockOf(block: ReturnType<typeof markdownBlocksOf>[number]): ReactElement {
  switch (block.kind) {
    case "heading": {
      return (
        <Text accessibilityRole="header" className={HEADING[block.level - 1] ?? ""}>
          {inline(block.text)}
        </Text>
      );
    }
    case "list": {
      return (
        <View className="gap-1">
          {block.items.map((item, position) => (
            // oxlint-disable-next-line react/no-array-index-key -- list items are parsed text with no identity but their place in the list
            <View key={position} className="flex-row gap-2">
              <Text tone="muted">{block.isOrdered ? `${position + 1}.` : "•"}</Text>
              <Text className="flex-1">{inline(item)}</Text>
            </View>
          ))}
        </View>
      );
    }
    case "quote": {
      return (
        <View className="border-s-2 border-separator ps-3">
          <Text tone="muted">{inline(block.text)}</Text>
        </View>
      );
    }
    case "code": {
      return (
        <CodeBlock code={block.code} {...(block.language ? { language: block.language } : {})} />
      );
    }
    default: {
      return <Text>{inline(block.text)}</Text>;
    }
  }
}

/** Markdown as the design system's text. */
export function MarkdownViewer({ source, className }: MarkdownViewerProps): ReactElement {
  return (
    <View className={["gap-3", className].filter(Boolean).join(" ")}>
      {markdownBlocksOf(source).map((block, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- parsed blocks have no identity but their place in the document
        <Fragment key={index}>{blockOf(block)}</Fragment>
      ))}
    </View>
  );
}
