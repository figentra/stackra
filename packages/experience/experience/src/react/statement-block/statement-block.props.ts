/**
 * Stackra file contract:
 * Purpose: `StatementBlockProps`, what a page hands the StatementBlock: one paragraph with its steel keywords marked,
 *          and the facts under it.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content; the `*` marks
 *           are the only syntax read, never markup.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */

/**
 * A statement paragraph and its facts.
 *
 * @example
 * <StatementBlock text="Write an *action* once; gen makes the *endpoint*." facts={["MIT", "Arabic first"]} />
 */
export interface StatementBlockProps {
  /** The paragraph; words between two `*` are drawn in steel. An unpaired `*` stays as written. */
  readonly text: string;
  /** Short facts listed under the paragraph, in order. */
  readonly facts?: readonly string[] | undefined;
  /** Styles the block. */
  readonly className?: string | undefined;
}
