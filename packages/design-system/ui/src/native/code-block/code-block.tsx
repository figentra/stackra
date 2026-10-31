/**
 * Stackra file contract:
 * Purpose: the native `CodeBlock`: an optional title, a language tag, a wrap toggle and the copy button over
 *          highlighted monospaced code (`codeRowsOf`, coloured by the theme's `syntax-<role>` colours) that scrolls
 *          sideways (or wraps), with optional line numbers, highlighted lines, diff marks and a prompt, selectable.
 *          Past `maxLines` it shows the first lines and a "Show all N lines" button. Several `files` become tabs.
 * Boundary: the code is written left to right, also in Arabic screens; the header follows the screen. `theme` is read
 *           as `auto` (a fixed scheme needs a scoped Uniwind theme, which this block does not set).
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { SyntaxRole } from "@stackra/tokens/contracts";
import { TextWrap } from "@stackra/icons/native/lucide-icons";
import type { ReactElement } from "react";
import { ScrollView, View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { codeTextOf } from "#core/functions/code-text-of.function";
import type { CodeRow } from "#core/types/code-row.type";
import { useCodeFrameState } from "#react/hooks/use-code-frame-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import type { CodeBlockProps } from "#native/code-block/code-block.props";
import { CopyButton } from "#native/copy-button/copy-button";
import { IconButton } from "#native/icon-button/icon-button";
import { Tabs } from "#native/tabs/tabs";
import { Text } from "#native/text/text";

/** Left to right, whatever the screen's direction. */
const LTR = { writingDirection: "ltr", textAlign: "left" } as const;

/** Each role's text class, written out so Uniwind finds them. */
const ROLE_CLASS: Readonly<Record<SyntaxRole, string>> = {
  keyword: "text-syntax-keyword",
  string: "text-syntax-string",
  number: "text-syntax-number",
  function: "text-syntax-function",
  type: "text-syntax-type",
  variable: "text-syntax-variable",
  comment: "text-syntax-comment",
  punctuation: "text-syntax-punctuation",
  tag: "text-syntax-tag",
  attribute: "text-syntax-attribute",
  operator: "text-syntax-operator",
  inserted: "text-syntax-inserted",
  deleted: "text-syntax-deleted",
};

/** A highlighted, inserted or deleted line's tint (10%, the share the syntax colours keep 4.5:1 on). */
const rowClass = (row: CodeRow) =>
  row.change === "inserted"
    ? "bg-syntax-inserted/10"
    : row.change === "deleted"
      ? "bg-syntax-deleted/10"
      : row.isHighlighted
        ? "bg-accent/10"
        : "";

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
  className,
}: Omit<CodeBlockProps, "files">): ReactElement {
  const t = useUiText();
  const {
    rows,
    shown,
    isCollapsible,
    isWrapped,
    toggleWrap,
    toggleExpanded,
    expandLabel,
    numberDigits,
  } = useCodeFrameState({
    code,
    language,
    isDiff,
    highlightLines,
    isWrapped: isWrappedAtStart,
    maxLines,
  });
  const numberWidth = numberDigits;
  const body = (
    <View className="min-w-full py-3">
      {shown.map((row) => (
        <View key={row.number} className={`flex-row px-3 ${rowClass(row)}`}>
          {showLineNumbers ? (
            <Text
              selectable={false}
              importantForAccessibility="no"
              className="me-4 text-end font-mono text-code leading-6 text-syntax-comment"
              style={{ minWidth: numberWidth * 8 }}
            >
              {row.number}
            </Text>
          ) : null}
          {isDiff ? (
            <Text
              selectable={false}
              importantForAccessibility="no"
              className={`me-2 font-mono text-code leading-6 ${row.change ? ROLE_CLASS[row.change] : ""}`}
            >
              {row.change ? DIFF_MARK[row.change] : " "}
            </Text>
          ) : null}
          {prompt ? (
            <Text
              selectable={false}
              importantForAccessibility="no"
              className="me-2 font-mono text-code leading-6 text-syntax-comment"
            >
              {prompt}
            </Text>
          ) : null}
          <Text
            selectable
            className={`font-mono text-code leading-6 ${isWrapped ? "flex-1" : ""}`}
            style={LTR}
          >
            {row.tokens.length === 0
              ? " "
              : row.tokens.map((token, index) => (
                  // oxlint-disable-next-line react/no-array-index-key -- a line's tokens never reorder
                  <Text key={index} {...(token.role ? { className: ROLE_CLASS[token.role] } : {})}>
                    {token.text}
                  </Text>
                ))}
          </Text>
        </View>
      ))}
    </View>
  );
  const label = title ?? t(UI_KEYS.ui.code_block.code);
  return (
    <View
      className={[
        "w-full overflow-hidden rounded-[var(--radius-container)] border border-separator bg-surface-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {title !== undefined || language !== undefined || isCopyable || showWrapToggle ? (
        <View className="flex-row items-center gap-2 border-b border-separator py-1 ps-3 pe-1">
          <Text type="caption" tone="muted" numberOfLines={1} className="flex-1 font-mono">
            {title ?? ""}
          </Text>
          {language ? (
            <Text type="caption" tone="muted" className="font-mono uppercase" style={LTR}>
              {language}
            </Text>
          ) : null}
          {showWrapToggle ? (
            <IconButton
              icon={<TextWrap size={16} />}
              label={t(UI_KEYS.ui.code_block.wrap)}
              variant={isWrapped ? "secondary" : "ghost"}
              size="sm"
              accessibilityState={{ selected: isWrapped }}
              onPress={toggleWrap}
            />
          ) : null}
          {isCopyable ? (
            <CopyButton
              value={codeTextOf(rows)}
              size="sm"
              {...(copyLabel === undefined ? {} : { label: copyLabel })}
            />
          ) : null}
        </View>
      ) : null}
      {isWrapped ? (
        <View accessibilityLabel={label}>{body}</View>
      ) : (
        <ScrollView horizontal accessibilityLabel={label} contentContainerClassName="min-w-full">
          {body}
        </ScrollView>
      )}
      {isCollapsible ? (
        <View className="border-t border-separator p-1">
          <Button variant="ghost" size="sm" isFullWidth onPress={toggleExpanded}>
            {expandLabel}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

/** A block of code, or several files as tabs. */
export function CodeBlock({ files, className, ...rest }: CodeBlockProps): ReactElement {
  const t = useUiText();
  if (!files || files.length === 0) return <CodeFrame {...rest} className={className} />;
  return (
    <View className={["w-full gap-2", className].filter(Boolean).join(" ")}>
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
    </View>
  );
}
