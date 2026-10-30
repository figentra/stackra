/**
 * Stackra file contract:
 * Purpose: the web `CodeBlock`: a figure as wide as its container with an optional title, a language tag, a wrap
 *          toggle and the copy button over highlighted code (`codeRowsOf`, coloured by the theme's `--syntax-<role>`),
 *          with optional line numbers, highlighted lines, diff marks and a shell prompt. Past `maxLines` it shows the
 *          first lines and a "Show all N lines" button, so it never scrolls up and down; long lines scroll sideways in
 *          the code area only (the header stays) or wrap. Several `files` become tabs, each a block of its own.
 * Boundary: the code is a left-to-right block (`dir="ltr"`), also in Arabic pages, while the header follows the page;
 *           the code area is focusable and named so keyboard users can scroll it. Colours and the width floor are
 *           inline styles, so they hold where the app's Tailwind does not scan this package.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.4.3 and 2.1.1; STA-1371.
 */
import { cn } from "@heroui/react";
import { TextWrap } from "@stackra/icons/react/lucide-icons";
import { type CSSProperties, type ReactElement, useMemo, useState } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { codeRowsOf } from "#core/functions/code-rows-of.function";
import { codeTextOf } from "#core/functions/code-text-of.function";
import type { CodeRow } from "#core/types/code-row.type";
import { Button } from "#react/button/button";
import type { CodeBlockProps } from "#react/code-block/code-block.props";
import { CopyButton } from "#react/copy-button/copy-button";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { Tabs } from "#react/tabs/tabs";

/** A line's tint: the role's colour at 10% over the code background (the share `syntaxColours` keeps 4.5:1 on). */
const tint = (variable: string) => `color-mix(in srgb, var(${variable}) 10%, transparent)`;

/** The background and edge of a highlighted, inserted or deleted line. */
function rowStyle(row: CodeRow): CSSProperties | undefined {
  if (row.change) return { background: tint(`--syntax-${row.change}`) };
  return row.isHighlighted
    ? { background: tint("--accent"), boxShadow: "inset 2px 0 var(--accent)" }
    : undefined;
}

const DIFF_MARK = { inserted: "+", deleted: "−" } as const;

/** One file's block. */
function CodeFrame({
  code = "",
  language,
  title,
  showLineNumbers = false,
  highlightLines,
  isDiff = false,
  prompt,
  isCopyable = true,
  copyLabel,
  isWrapped: isWrappedAtStart = false,
  showWrapToggle = false,
  maxLines = 30,
  theme = "auto",
  className,
}: Omit<CodeBlockProps, "files">): ReactElement {
  const t = useUiText();
  const [isWrapped, setWrapped] = useState(isWrappedAtStart);
  const [isExpanded, setExpanded] = useState(false);
  const rows = useMemo(
    () => codeRowsOf(code, { language, isDiff, highlightLines }),
    [code, language, isDiff, highlightLines],
  );
  const isCollapsible = maxLines > 0 && rows.length > maxLines;
  const shown = isCollapsible && !isExpanded ? rows.slice(0, maxLines) : rows;
  const hasHeader = title !== undefined || language !== undefined || isCopyable || showWrapToggle;
  const numberWidth = `${String(rows.length).length}ch`;
  return (
    <figure
      data-slot="code-block"
      {...(theme === "auto" ? {} : { "data-theme": theme })}
      className={cn(
        "m-0 overflow-hidden border border-separator bg-surface-secondary text-foreground",
        theme === "dark" && "dark",
        className,
      )}
      // As wide as its container, never shrink-wrapped to its code in a centred frame; a floor so it never collapses.
      style={{
        inlineSize: "100%",
        minInlineSize: "min(100%, 16rem)",
        color: "var(--foreground)",
        borderRadius: "var(--radius-container)",
      }}
    >
      {hasHeader ? (
        <figcaption className="flex items-center gap-2 border-b border-separator py-1 ps-3 pe-1">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">
            {/* Isolated, so "@stackra/ui" keeps its "@" in front in an Arabic header. */}
            {title === undefined ? null : <bdi>{title}</bdi>}
          </span>
          {language ? (
            <span dir="ltr" className="font-mono text-[11px] uppercase text-muted">
              {language}
            </span>
          ) : null}
          {showWrapToggle ? (
            <IconButton
              icon={<TextWrap size={16} aria-hidden />}
              label={t(UI_KEYS.ui.code_block.wrap)}
              variant={isWrapped ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={isWrapped}
              onPress={() => setWrapped((wrapped) => !wrapped)}
            />
          ) : null}
          {isCopyable ? (
            <CopyButton
              value={codeTextOf(rows)}
              size="sm"
              {...(copyLabel === undefined ? {} : { label: copyLabel })}
            />
          ) : null}
        </figcaption>
      ) : null}
      <pre
        dir="ltr"
        // A named, focusable scroller: `group` makes the name valid on a <pre> (axe aria-prohibited-attr) without
        // making each block a landmark (two examples showing the same file would repeat one).
        role="group"
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
        tabIndex={0}
        aria-label={title ?? t(UI_KEYS.ui.code_block.code)}
        className="m-0 overflow-x-auto py-3 text-start font-mono text-[13px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <code className={cn("block", isWrapped ? "w-full" : "w-max min-w-full")}>
          {shown.map((row) => {
            const Line =
              row.change === "inserted" ? "ins" : row.change === "deleted" ? "del" : "span";
            return (
              <span key={row.number} className="flex px-3" style={rowStyle(row)}>
                {showLineNumbers ? (
                  <span
                    aria-hidden
                    className="me-4 shrink-0 select-none text-end tabular-nums"
                    style={{ minInlineSize: numberWidth, color: "var(--syntax-comment)" }}
                  >
                    {row.number}
                  </span>
                ) : null}
                {isDiff ? (
                  // The mark is drawn by CSS: a lone "+" or "-" as text is left for review by axe's contrast check.
                  <span
                    aria-hidden
                    data-mark={row.change ? DIFF_MARK[row.change] : " "}
                    className="me-2 w-[1ch] shrink-0 select-none before:content-[attr(data-mark)]"
                    style={row.change ? { color: `var(--syntax-${row.change})` } : undefined}
                  />
                ) : null}
                {prompt ? (
                  <span
                    aria-hidden
                    className="me-[1ch] shrink-0 select-none"
                    style={{ color: "var(--syntax-comment)" }}
                  >
                    {prompt}
                  </span>
                ) : null}
                <Line
                  className={cn(
                    "min-w-0 flex-1 no-underline",
                    isWrapped ? "whitespace-pre-wrap break-words" : "whitespace-pre",
                  )}
                >
                  {row.tokens.length === 0
                    ? " "
                    : row.tokens.map((token, index) =>
                        token.role ? (
                          // oxlint-disable-next-line react/no-array-index-key -- a line's tokens never reorder
                          <span key={index} style={{ color: `var(--syntax-${token.role})` }}>
                            {token.text}
                          </span>
                        ) : (
                          token.text
                        ),
                      )}
                </Line>
              </span>
            );
          })}
        </code>
      </pre>
      {isCollapsible ? (
        <div className="border-t border-separator p-1">
          <Button
            variant="ghost"
            size="sm"
            isFullWidth
            aria-expanded={isExpanded}
            onPress={() => setExpanded((expanded) => !expanded)}
          >
            {isExpanded
              ? t(UI_KEYS.ui.code_block.show_less)
              : t(UI_KEYS.ui.code_block.show_all, { count: rows.length })}
          </Button>
        </div>
      ) : null}
    </figure>
  );
}

/** A block of code, or several files as tabs. */
export function CodeBlock({ files, className, ...rest }: CodeBlockProps): ReactElement {
  const t = useUiText();
  if (!files || files.length === 0) return <CodeFrame {...rest} className={className} />;
  return (
    <div
      data-slot="code-block-files"
      className={cn("grid gap-2", className)}
      style={{ inlineSize: "100%", minInlineSize: "min(100%, 16rem)" }}
    >
      <Tabs
        label={t(UI_KEYS.ui.code_block.files)}
        variant="secondary"
        items={files.map((file, index) => ({
          id: String(index),
          label: file.title,
          content: (
            <CodeFrame {...rest} code={file.code} language={file.language} title={undefined} />
          ),
        }))}
      />
    </div>
  );
}
