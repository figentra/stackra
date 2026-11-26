/**
 * Stackra file contract:
 * Purpose: `ChapterTitleProps`, what a page hands the ChapterTitle: the chapter's title, its subtitle and
 *          its place in the outline.
 * Boundary: an interface in its own file beside the component (ADR 0305). Every word is page content.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`); STA-2041 (the landing).
 */

/**
 * A chapter's title on the landing.
 *
 * @example
 * <ChapterTitle title="Write it once" subtitle="One action becomes every surface." />
 */
export interface ChapterTitleProps {
  /** The chapter's heading. */
  readonly title: string;
  /** A line under the title. */
  readonly subtitle?: string | undefined;
  /** The heading's place in the outline, under the hero's `h1`. Defaults to 2; it always looks like an `h2`. */
  readonly level?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** Styles the block. */
  readonly className?: string | undefined;
}
