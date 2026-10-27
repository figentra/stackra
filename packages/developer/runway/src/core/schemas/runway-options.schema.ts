/**
 * Stackra file contract:
 * Purpose: `RunwayOptions`, the options shape of `RunwayConfig`: what the runway providers need beyond the runway
 *          itself: the Encore Cloud app id and working tree, and the folders of the mobile and docs apps.
 * Boundary: a shape class: fields and defaults only; `RunwayConfig$` mirrors it and is the schema `buildConfig`
 *           validates with. The Encore app id is empty until set (`providers.encore.app` of the root runway); the
 *           folders are relative to the repository root.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: the providers); ADR 0294 (decision 19).
 */
import { Schema } from "@stackra/validation";

/** The options of `RunwayConfig`. */
export class RunwayOptions extends Schema {
  /** The Encore Cloud app id the `encore-cloud` provider pushes to (`providers.encore.app`); empty until set. */
  encoreApp = "";

  /** The git working tree that holds the commits Encore Cloud receives; empty means the current folder. */
  encoreCwd = "";

  /** The mobile app's folder, where the `eas` provider runs. */
  easProjectDir = "apps/mobile";

  /** The docs app's folder, whose generated site the `mintlify` provider publishes. */
  mintlifyProjectDir = "apps/docs";
}
