/**
 * Stackra file contract:
 * Purpose: the document-outline levels of a heading, 1 to 6, as HTML defines them.
 * Boundary: the values only; the web Heading renders `h<level>`, the native one has no level to report (React
 *          Native's header role carries none).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 2.4.6.
 */

/** The heading levels, outermost first. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the levels carry no labels.
export const HeadingLevel = Object.freeze([1, 2, 3, 4, 5, 6] as const);

/** One heading level. */
export type HeadingLevel = (typeof HeadingLevel)[number];
