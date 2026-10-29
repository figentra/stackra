/**
 * Stackra file contract:
 * Purpose: `MobileJobResult`, what one mobile job run did: the app and scope, the Expo config it wrote, the build
 *          record the EAS provider answered, the store accounts the submit step publishes under and the template
 *          release it checked out.
 * Boundary: type only; `runMobileJob` returns it. Plain data: ids and names, never a key.
 * Runtime: node
 * Governing contract: ADR 0439 (decision 2); ADR 0352 (decision 3).
 */
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { LineCheckout } from "#node/types/line-checkout.type";
import type { MobileStoreAccount } from "#node/types/mobile-store-account.type";

/** One finished mobile job run. */
export type MobileJobResult = {
  /** The app key. */
  readonly app: string;
  /** The scope id, for a white-label build. */
  readonly scope?: string;
  /** The `expo` block written to the template checkout's `app.json`. */
  readonly config: Readonly<Record<string, unknown>>;
  /** The EAS build record (the build ids). */
  readonly record: DeployRecord;
  /** The store accounts the build publishes under. */
  readonly stores: readonly MobileStoreAccount[];
  /** The template line release the job checked out, when it was given `line`. */
  readonly template?: LineCheckout;
};
