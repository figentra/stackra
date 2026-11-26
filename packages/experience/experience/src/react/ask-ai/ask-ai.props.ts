/**
 * Stackra file contract:
 * Purpose: `AskAiProps`, what a page hands the AskAi: its name, where it goes, the question it shows and the
 *          coming-soon note.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041.
 */

/**
 * A field-shaped link that asks the docs.
 *
 * @example
 * <AskAi label="Ask the docs" docsUrl="/docs/search" placeholder="How do I cancel an order?" />
 */
export interface AskAiProps {
  /** The link's visible and spoken name, such as "Ask the docs". */
  readonly label: string;
  /** Where it goes: the docs search, until the assistant answers on the page. */
  readonly docsUrl: string;
  /** The sample question it shows greyed, as a field shows its placeholder. Decorative. */
  readonly placeholder?: string | undefined;
  /** True (the default) draws it quiet, with `comingSoonNote` under it, until the assistant's gateway is live. */
  readonly isComingSoon?: boolean | undefined;
  /** The note under it while `isComingSoon`, such as "Answers here are coming soon; until then it opens the docs." */
  readonly comingSoonNote?: string | undefined;
  /** Styles the block. */
  readonly className?: string | undefined;
}
