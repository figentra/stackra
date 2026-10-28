/**
 * Stackra file contract:
 * Purpose: `DevtoolsTabSinkDefinition`, the tab a devtools entry hands `DevtoolsTabSink.defineTab`: its metadata and
 *          the function that reads its data when a host opens it.
 * Boundary: a type only. It mirrors `DevtoolsTabDefinition` of @stackra/devtools-kit by shape; a change there is a
 *           change here.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 4); ADR 0461.
 */

/** What a devtools entry hands the kit for one tab. */
export interface DevtoolsTabSinkDefinition {
  /** Dotted lowercase segments, the package key first: `container.bindings`. */
  readonly id: string;

  /** The label the panel shows. */
  readonly title: string;

  /** An icon name the panel resolves. */
  readonly icon?: string;

  /** Groups tabs in the panel, usually the package key. */
  readonly category?: string;

  /** Sort position; lower first. */
  readonly order?: number;

  /** Withheld from a host that did not accept sensitive tabs. */
  readonly sensitive?: boolean;

  /** Reads the tab's data when a host opens it. */
  read: () => unknown;
}
