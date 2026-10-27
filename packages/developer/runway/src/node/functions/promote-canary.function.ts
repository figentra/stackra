/**
 * Stackra file contract:
 * Purpose: `promoteCanary(request)`, judges one canary with `canaryVerdict` and acts on the verdict in the edge KV
 *          copy. A product release canary: `promote` writes the canary's release to `release:<product>:<surface>`
 *          and removes `canary:<product>:<surface>`; `rollback` removes the canary row only. A shell canary:
 *          `promote` writes the canary release alone to `shell:<surface>:<line>`; `rollback` writes the current
 *          release back alone. `hold` writes nothing.
 * Boundary: writes through the `EdgeKvWriter` port only. Order matters for KV's eventual consistency: the release
 *           row is written before the canary row is removed, so no host is left without a release.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 5.3 and 16 (points 3 and 4); ADR 0437 (the KV copy).
 */
import { EdgeKvPrefix } from "@stackra/app/contracts";

import { EDGE_PUBLISH_SETTINGS } from "#node/constants/edge-publish-settings.constant";
import { canaryVerdict } from "#node/functions/canary-verdict.function";
import type { CanaryPromotionRequest } from "#node/types/canary-promotion-request.type";
import type { CanaryVerdict } from "#node/types/canary-verdict.type";
import type { EdgeCanary } from "#node/types/edge-canary.type";

/** The release a canary carries, as JSON without its scopes and start. */
function releaseOf(canary: EdgeCanary<object>): string {
  const { scopes: _scopes, since: _since, ...release } = canary;
  return JSON.stringify(release);
}

/**
 * The verdict, after acting on it.
 *
 * @example
 * const verdict = await promoteCanary({ kv, promotion: { kind: "release", product, surface, canary }, sample });
 */
export async function promoteCanary(request: CanaryPromotionRequest): Promise<CanaryVerdict> {
  const { kv, promotion } = request;
  const verdict = canaryVerdict(promotion.canary.since, request.sample, request.now ?? new Date(), {
    ...EDGE_PUBLISH_SETTINGS.canary,
    ...request.settings,
  });
  if (verdict === "hold") return verdict;
  if (promotion.kind === "release") {
    const { product, surface } = promotion;
    if (verdict === "promote")
      await kv.put(`${EdgeKvPrefix.Release}:${product}:${surface}`, releaseOf(promotion.canary));
    await kv.delete(`${EdgeKvPrefix.Canary}:${product}:${surface}`);
    return verdict;
  }
  await kv.put(
    `${EdgeKvPrefix.Shell}:${promotion.surface}:${promotion.line}`,
    verdict === "promote" ? releaseOf(promotion.canary) : JSON.stringify(promotion.current),
  );
  return verdict;
}
