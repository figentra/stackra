/**
 * Stackra file contract:
 * Purpose: `CanaryPromotionRequest`, one judgement of a canary: the KV writer, the canary, its traffic since it
 *          started, the time and any setting overrides.
 * Boundary: type only; `promoteCanary` takes it. The deploy workflow runs it on a schedule; a timer alone never
 *           promotes.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 16 (points 3 and 4).
 */
import type { EdgeKvWriter } from "@stackra/app/contracts";

import type { CanaryPromotion } from "#node/types/canary-promotion.type";
import type { CanarySample } from "#node/types/canary-sample.type";
import type { CanarySettings } from "#node/types/canary-settings.type";

/** One canary to judge. */
export type CanaryPromotionRequest = {
  readonly kv: EdgeKvWriter;
  readonly promotion: CanaryPromotion;
  /** The canary's requests and errors since it started. */
  readonly sample: CanarySample;
  /** The time of the judgement; now when absent. */
  readonly now?: Date;
  /** Overrides of `EDGE_PUBLISH_SETTINGS.canary`. */
  readonly settings?: Partial<CanarySettings>;
};
