/**
 * Stackra file contract:
 * Purpose: `CodeBlockContractProps`, the props of every runtime's `CodeBlock`: code shown left to right in a
 *          monospaced block, highlighted in the theme's syntax colours, with an optional title, language tag, line
 *          numbers, highlighted lines, diff marks, a shell prompt, a wrap toggle, a collapse past `maxLines` and a
 *          copy button; or several files as tabs.
 * Boundary: types only. Code is always isolated left to right, also inside an Arabic page; the header follows the page.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0060 (right-to-left); STA-1371.
 */
import type { CodeFile } from "#contracts/types/code-file.type";

/** Props shared by the web and native `CodeBlock`. */
export interface CodeBlockContractProps {
  /** The code. Ignored when `files` is given. */
  readonly code?: string | undefined;
  /** The language, highlighted and shown as a tag: ts, tsx, js, json, css, html, bash, md, yaml, sql, diff. */
  readonly language?: string | undefined;
  /** A file name or caption over the code. */
  readonly title?: string | undefined;
  /** Several files, one tab each (`title`, `code`, `language`); replaces `code`, `title` and `language`. */
  readonly files?: readonly CodeFile[] | undefined;
  /** Shows a number beside each line when true. */
  readonly showLineNumbers?: boolean | undefined;
  /** Lines to highlight, from 1: numbers and ranges such as `[2, "4-6"]`. */
  readonly highlightLines?: readonly (number | `${number}-${number}`)[] | undefined;
  /** Reads a leading `+` as an inserted line and `-` as a deleted one; the copy button copies the result. */
  readonly isDiff?: boolean | undefined;
  /** A prompt drawn before each line and left out of selection and copy, such as `$` for shell commands. */
  readonly prompt?: string | undefined;
  /** Shows the copy button; on by default. */
  readonly isCopyable?: boolean | undefined;
  /** The copy button's accessible name; "Copy" by default. */
  readonly copyLabel?: string | undefined;
  /** Wraps long lines instead of scrolling sideways (the start state when `showWrapToggle` is on). */
  readonly isWrapped?: boolean | undefined;
  /** Shows a header button that turns wrapping on and off. */
  readonly showWrapToggle?: boolean | undefined;
  /** The lines shown before a "Show all N lines" button (no inner scroll); 30 by default, `0` for all. */
  readonly maxLines?: number | undefined;
  /** `auto` follows the page's scheme; `light` or `dark` keep the block in that scheme. */
  readonly theme?: "auto" | "light" | "dark" | undefined;
}
