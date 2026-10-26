/**
 * Stackra file contract:
 * Purpose: `MobileBuildRequest`, one mobile build the job runs: the product, the app key, its entry (from the root
 *          runway, or from tenant data for a white-label app), what started it, the release commit or tenant, and
 *          whose store accounts it publishes under.
 * Boundary: type only. A tenant-started request's entry comes from the OS and is checked against the mobile app
 *           schema before any build.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decisions 2, 7 and 8).
 */
import type { AppPublisher } from "#core/enums/app-publisher.enum";
import type { MobileBuildTrigger } from "#core/enums/mobile-build-trigger.enum";
import type { MobileApp } from "#core/types/mobile-app.type";

/** One build. */
export interface MobileBuildRequest {
  /** The product's registry key. */
  readonly product: string;

  /** The app key (`staff`, `shopper`). */
  readonly app: string;

  /** The app's entry. */
  readonly entry: MobileApp;

  /** What started the build. */
  readonly trigger: MobileBuildTrigger;

  /** The release commit, for a product merge. */
  readonly sha?: string;

  /** The tenant id, for a tenant event. */
  readonly tenant?: string;

  /** Whose store accounts the build publishes under. */
  readonly publisher: AppPublisher;
}
