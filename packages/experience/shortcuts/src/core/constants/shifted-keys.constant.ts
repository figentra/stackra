/**
 * Stackra file contract:
 * Purpose: `SHIFTED_KEYS`, the character each printable key produces with Shift on the US layout bindings name keys by
 *          (`/` gives `?`, `1` gives `!`), so a hint shows `?` for `shift+/` instead of `⇧/`.
 * Boundary: data only; display only. Matching stays on the physical key (`event.code`).
 * Runtime: isomorphic
 * Governing contract: ADR 0508 (hints show the key a person presses).
 */

/** The shifted character of each printable key that has one; letters keep Shift. */
export const SHIFTED_KEYS: Readonly<Record<string, string>> = Object.freeze({
  "`": "~",
  "1": "!",
  "2": "@",
  "3": "#",
  "4": "$",
  "5": "%",
  "6": "^",
  "7": "&",
  "8": "*",
  "9": "(",
  "0": ")",
  "-": "_",
  "=": "+",
  "[": "{",
  "]": "}",
  "\\": "|",
  ";": ":",
  "'": '"',
  ",": "<",
  ".": ">",
  "/": "?",
});
