/**
 * Stackra file contract:
 * Purpose: `ServerRenderOptions`, what a host passes the node renderer: the locale and its text direction, the server
 *          blocks it may draw, the render's data and the page title.
 * Boundary: a type only. The direction is the locale's setting, passed by the host, never guessed from a locale code.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 6); ADR 0110 (decision 4).
 */
import type { Json } from "@stackra/contracts";

import type { ServerBlock } from "#server/types/server-block.type";

/** The options of one node render. */
export interface ServerRenderOptions {
  /** The render's locale (`ar-SA`). */
  readonly locale: string;

  /** The locale's text direction; `auto` when absent. */
  readonly direction?: "ltr" | "rtl" | "auto";

  /** Every block the document may name. */
  readonly blocks: readonly ServerBlock[];

  /** The values the blocks read (`{ order, recipient }`); `{}` when absent. */
  readonly data?: Readonly<Record<string, Json>>;

  /** The page `<title>` (the email subject, the document's name); empty when absent. */
  readonly title?: string;
}
