/**
 * Stackra file contract:
 * Purpose: `JsonViewerContractProps`, the props of every runtime's `JsonViewer`: a JSON value as a tree whose objects
 *          and arrays fold.
 * Boundary: types only. Keys and values are shown left to right; nothing is evaluated.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** Props shared by the web and native `JsonViewer`. */
export interface JsonViewerContractProps {
  /** Any JSON value: a payload, a webhook body, an event. */
  readonly value: unknown;
  /** The tree's accessible name, such as "Webhook payload". */
  readonly label: string;
  /** How many levels start open; 1 by default. */
  readonly defaultExpandDepth?: number | undefined;
}
