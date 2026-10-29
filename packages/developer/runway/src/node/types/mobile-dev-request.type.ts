/**
 * Stackra file contract:
 * Purpose: `MobileDevRequest`, one local run of a product's mobile app: the product repository and the app of its
 *          root runway `mobile`, where the app's template line comes from, the folder it is checked out into, and
 *          the `node_modules` folder the checkout links to (the template line's own install).
 * Boundary: type only; `prepareMobileDev` takes it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6: local development runs the real shell); ADR 0439; ADR 0481.
 */
import type { LineSource } from "#node/types/line-source.type";

/** One local mobile run. */
export type MobileDevRequest = {
  /** The product repository's root folder, holding the root `runway.yaml`. */
  readonly repository: string;
  /** The app key under the root runway's `mobile`. */
  readonly app: string;
  /** Where the template line comes from; a local checkout for development. */
  readonly line: LineSource;
  /** The checkout folder; `.stackra/mobile/<app>` under the repository when absent. Replaced on every run. */
  readonly into?: string;
  /** The installed `node_modules` the checkout links to, such as the local line's `apps/mobile/node_modules`. */
  readonly nodeModules: string;
};
