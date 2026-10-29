/**
 * Stackra file contract:
 * Purpose: `MobileJobRequest`, one run of the mobile job: the repository and the app of its root runway `mobile`, the
 *          checkout of the app's template line (or where to check it out from), the commit being built, the environment, the resolved store accounts
 *          and, for a scope-started white-label build, the variant.
 * Boundary: type only; `runMobileJob` takes it. A merge starts the job without `variant`; an OS event for a scope
 *           starts it with one.
 * Runtime: node
 * Governing contract: ADR 0439 (decisions 2 and 8); ADR 0352 (decision 3).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { LineSource } from "#node/types/line-source.type";
import type { MobileStoreAccount } from "#node/types/mobile-store-account.type";
import type { MobileVariant } from "#node/types/mobile-variant.type";

/** One mobile job run. */
export type MobileJobRequest = {
  /** The product repository's root folder, holding the root `runway.yaml` and `assets/`. */
  readonly repository: string;
  /** The app key under the root runway's `mobile`, `staff`. */
  readonly app: string;
  /** The checkout of the app's template line, holding its `app.json` and `capabilities.json`; the build runs here. */
  readonly templateDir: string;
  /** Check the app's template line out into `templateDir` (absent or empty) first, from this source (ADR 0481). */
  readonly line?: LineSource;
  /** The commit checked out in `templateDir`; required unless `line`, whose checkout commit is built instead. */
  readonly sha?: string;
  /** The environment whose release this build is. */
  readonly environment: RunwayEnvironment;
  /** The account each store publishes under, from `storeAccountsOf` (@stackra/infra-mobile). */
  readonly stores: readonly MobileStoreAccount[];
  /** The white-label variant, when a scope started the build. */
  readonly variant?: MobileVariant;
  /** The command runner; `runCommand` when absent. */
  readonly run?: CommandRunner;
};
