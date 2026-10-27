/**
 * Stackra file contract:
 * Purpose: `ServerBlockContext`, what a server block's `html` is told besides its props and children: the locale,
 *          where the node sits, and the render's data (the order, the recipient) the host resolved for this render.
 * Boundary: a type only. `data` is the host's per-render values; the renderer passes it through untouched and never
 *           runs a query for it. It may hold personal data: a block writes it through `escapeHtml` and stores nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6: templates rendered by the node renderer); ADR 0110 (decision 4).
 */
import type { Json } from "@stackra/contracts";

/** Where the block sits, the locale, and the render's data. */
export interface ServerBlockContext {
  /** The render's locale, already applied to every `LocalizedText` prop. */
  readonly locale: string;

  /** Where the node sits (`0.children.2`). */
  readonly path: string;

  /** The values the host resolved for this render (`{ order, recipient }`); `{}` when none. */
  readonly data: Readonly<Record<string, Json>>;
}
