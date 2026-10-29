/**
 * Stackra file contract:
 * Purpose: `MobileDev`, what `prepareMobileDev` set up: the checkout folder, the template release, the Expo config it
 *          wrote and the product packages' native entries the app imports.
 * Boundary: type only. Plain data.
 * Runtime: node
 * Governing contract: ADR 0439; ADR 0481.
 */
import type { LineCheckout } from "#node/types/line-checkout.type";

/** One prepared local mobile run. */
export type MobileDev = {
  /** The checkout folder the app builds in. */
  readonly dir: string;
  /** The template line release checked out. */
  readonly template: LineCheckout;
  /** The `expo` block written to the checkout's `app.json`. */
  readonly config: Readonly<Record<string, unknown>>;
  /** Each product package's `./native` entry (absolute), in runway order. */
  readonly entries: readonly string[];
};
