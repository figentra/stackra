/**
 * Stackra file contract:
 * Purpose: `DevtoolsTabMetadata`, what a host is told about a tab: its id, title and the panel hints, without the
 *          function that reads it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decisions 2 to 4: packages plug their own panels in).
 */

/** A tab as a host lists it. */
export interface DevtoolsTabMetadata {
  /** Unique across the app, the package key first: `router.tree`. */
  readonly id: string;

  /** The label the panel shows. */
  readonly title: string;

  /** An icon name the panel resolves, never a URL. */
  readonly icon?: string;

  /** Groups tabs in the panel, usually the package key. */
  readonly category?: string;

  /** Sort position; lower first, 0 when absent, then by id. */
  readonly order?: number;

  /** Withheld from a host that did not declare `acceptsSensitive` (tokens, personal data, secrets' names). */
  readonly sensitive?: boolean;
}
