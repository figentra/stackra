/**
 * Stackra file contract:
 * Purpose: `ProductDeployRequest`, one deploy of a built product to an environment: the repository (holding the build
 *          manifest), the environment, whether its approval was given, the edge KV writer and asset store, the shell
 *          lines the edge serves, the canary scopes or a first release, the home region, the app-link keys, the ops
 *          review, the store accounts of each mobile app, and whether it is a dry run.
 * Boundary: type only; `deployProduct` takes it. The asset store, KV namespace, served lines and canary scopes are OS
 *           facts the deploy workflow passes; nothing here is a secret.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4, 10 and 13); ADR 0437; ADR 0439 (decision 7); ADR 0170 (approvals).
 */
import type { EdgeKvWriter } from "@stackra/app/contracts";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { AppLinkKeys } from "#node/types/app-link-keys.type";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { MobileStoreAccount } from "#node/types/mobile-store-account.type";
import type { OpsReview } from "#node/types/ops-review.type";

/** One product deploy. */
export type ProductDeployRequest = {
  /** The product repository's root folder, holding `dist/product/build.json` from `buildProduct`. */
  readonly repository: string;
  /** The environment deployed to. */
  readonly environment: RunwayEnvironment;
  /** The environment's approval was given (the deploy job runs behind it); required when the runway names one. */
  readonly approved?: boolean;
  /** The edge KV writer of that environment; a dry run keeps the rows in memory instead. */
  readonly kv?: EdgeKvWriter;
  /** The asset store: the R2 bucket and its public origin. */
  readonly assets: { readonly bucket: string; readonly origin: string };
  /** The shell lines the edge serves, `<surface>@<major>`. */
  readonly served: readonly string[];
  /** The internal and demo scope ids a new release goes to first. */
  readonly canaryScopes?: readonly string[];
  /** No release exists yet for these surfaces. */
  readonly firstRelease?: boolean;
  /** The home region platform hosts send API calls to. */
  readonly region?: string;
  /** Apple team ids and Android certificates for the app-link files. */
  readonly appLinks?: AppLinkKeys;
  /** The ops review, when the root runway has `surfaces.ops`. */
  readonly review?: OpsReview;
  /** The store accounts each mobile app submits under (`storeAccountsOf`), by app key. */
  readonly stores?: Readonly<Record<string, readonly MobileStoreAccount[]>>;
  /** Publish the web surfaces only: no store check and no submission (a dev or preview deploy). */
  readonly surfacesOnly?: boolean;
  /** Record every upload, KV write and submission instead of making it. */
  readonly dryRun?: boolean;
  /** The command runner; `runCommand` when absent. */
  readonly run?: CommandRunner;
};
