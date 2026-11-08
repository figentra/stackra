/**
 * Stackra file contract:
 * Purpose: `MessageAction`, a button a message carries: its label and the link it opens, with an optional emphasis.
 * Boundary: a type only. The link is opened as is, so a link that acts (an approval) must carry its own proof
 *           (a signed, single-use token) and ask the person to sign in; the button never acts on its own. A chat driver
 *           renders it as the provider's button (Slack `actions` blocks); a push driver passes it to the app, which shows
 *           it under the push's action category.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 1); ADR 0533 (decision 4: one-tap approvals).
 */

/**
 * One button.
 *
 * @example
 * const approve: MessageAction = { label: "Approve", url: links.approve, style: "primary" };
 */
export interface MessageAction {
  /** The button's text, already translated. */
  readonly label: string;

  /** The https link the button opens. */
  readonly url: string;

  /** The emphasis: `primary` for the expected answer, `danger` for a destructive one; absent is plain. */
  readonly style?: "primary" | "danger";
}
