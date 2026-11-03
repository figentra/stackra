/**
 * Stackra file contract:
 * Purpose: `CtaRowProps`, what a page hands the CtaRow: the one primary link, a copy link and a command.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */

/**
 * The landing's call-to-action row.
 *
 * @example
 * <CtaRow primary={{ label: "Read the docs", href: "/docs" }} command="stackra create my-app" />
 */
export interface CtaRowProps {
  /** The one primary action, a link drawn as the champagne pill. */
  readonly primary: { readonly label: string; readonly href: string };
  /** A button that copies `value` (the llms.txt URL); `label` is its visible words and its spoken name. */
  readonly copyLink?: { readonly label: string; readonly value: string } | undefined;
  /** A shell command drawn as a mono chip with its own copy button, such as `stackra create my-app`. */
  readonly command?: string | undefined;
  /** Styles the row. */
  readonly className?: string | undefined;
}
