/**
 * Stackra file contract:
 * Purpose: `SYMBOLS`, the marks and box lines of the console layout in Unicode, and their ASCII stand-ins for a
 *          terminal without Unicode.
 * Boundary: data only; the same for every theme.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-017 and FR-021.
 */

/** One set of symbols. */
interface SymbolSet {
  readonly info: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly skip: string;
  readonly bullet: string;
  readonly dot: string;
  readonly pointer: string;
  readonly checked: string;
  readonly unchecked: string;
  readonly bar: string;
  readonly corner: string;
  readonly box: readonly [string, string, string, string, string, string];
  readonly spinner: readonly string[];
  readonly fill: string;
  readonly empty: string;
}

/** The symbols, by whether the terminal has Unicode. */
export const SYMBOLS: Readonly<Record<"unicode" | "ascii", SymbolSet>> = Object.freeze({
  unicode: {
    info: "●",
    success: "✓",
    warning: "⚠",
    error: "✗",
    skip: "–",
    bullet: "•",
    dot: ".",
    pointer: "›",
    checked: "◼",
    unchecked: "◻",
    bar: "│",
    corner: "└",
    // top-left, top-right, bottom-left, bottom-right, horizontal, vertical
    box: ["╭", "╮", "╰", "╯", "─", "│"],
    spinner: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    fill: "█",
    empty: "░",
  },
  ascii: {
    info: "*",
    success: "+",
    warning: "!",
    error: "x",
    skip: "-",
    bullet: "-",
    dot: ".",
    pointer: ">",
    checked: "[x]",
    unchecked: "[ ]",
    bar: "|",
    corner: "`",
    box: ["+", "+", "+", "+", "-", "|"],
    spinner: ["-", "\\", "|", "/"],
    fill: "#",
    empty: "-",
  },
});
