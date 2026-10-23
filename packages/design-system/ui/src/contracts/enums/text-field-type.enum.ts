/**
 * Stackra file contract:
 * Purpose: the kinds of text a text field or input group takes: plain text, an email address, a password, a phone
 *          number or a URL. On web each is the `type` of the input; on native each maps to the keyboard, the masking and
 *          the capitalisation that kind needs, so one prop reaches both runtimes.
 * Boundary: the values only; the native mapping lives in the native `TextField`. Numbers and search have their own
 *           fields, so they are not in the list.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API); ADR 0303 (decision 7: props vocabulary).
 */

/** The kinds of text, `text` first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the kinds carry no labels.
export const TextFieldType = Object.freeze(["text", "email", "password", "tel", "url"] as const);

/** One kind of text. */
export type TextFieldType = (typeof TextFieldType)[number];
