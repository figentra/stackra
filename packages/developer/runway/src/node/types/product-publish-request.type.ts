/**
 * Stackra file contract:
 * Purpose: `ProductPublishRequest`, one run of the publish step for a product checkout and one environment: the KV
 *          writer, the asset store, the shell lines the edge serves, the canary scopes (or a first release), the
 *          home region, the app-link keys and the ops review.
 * Boundary: type only; `publishProduct` takes it. The bucket, origin, served lines and canary scopes are OS facts
 *           the deploy workflow passes in; nothing here is a secret.
 * Runtime: node
 * Governing contract: ADR 0436 (decisions 4 and 10); ADR 0437; app-shells 4.2, 5.3, 8.3, 15 (point 7) and 16
 *                     (points 4 and 7); owner decisions D2, D6 and D9; ADR 0323 and R-59 (scope).
 */
import type { EdgeKvWriter } from "@stackra/app/contracts";

import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";
import type { AppLinkKeys } from "#node/types/app-link-keys.type";
import type { CommandRunner } from "#node/types/command-runner.type";
import type { OpsReview } from "#node/types/ops-review.type";

/** One publish of a product's web surfaces to one environment. */
export type ProductPublishRequest = {
  /** The product repository's root folder: the root `runway.yaml` and the built bundles under it. */
  readonly repository: string;
  /** The environment whose zone and regions the host rows use. */
  readonly environment: RunwayEnvironment;
  /** The edge KV writer of that environment. */
  readonly kv: EdgeKvWriter;
  /** The asset store: the R2 bucket and the public origin that serves it. */
  readonly assets: { readonly bucket: string; readonly origin: string };
  /** The shell lines the edge serves, `<surface>@<major>`; a bundle targeting another is refused. */
  readonly served: readonly string[];
  /** The internal and demo scope ids that get the release first (D6). Required unless `firstRelease`. */
  readonly canaryScopes?: readonly string[];
  /** No release exists yet for these surfaces: write `release:` directly, with no canary to judge against. */
  readonly firstRelease?: boolean;
  /** The region platform hosts send API calls to; the environment's first region when absent. */
  readonly region?: string;
  /** Apple team ids and Android certificates for the app-link files. */
  readonly appLinks?: AppLinkKeys;
  /** The review of the change; required when the root runway has `surfaces.ops`. */
  readonly review?: OpsReview;
  /** The canary start; now when absent. */
  readonly now?: Date;
  /** The command runner; `runCommand` when absent. */
  readonly run?: CommandRunner;
};
