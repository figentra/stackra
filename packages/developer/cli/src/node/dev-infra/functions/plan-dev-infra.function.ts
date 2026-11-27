/**
 * Stackra file contract:
 * Purpose: `planDevInfra(root, lane, optIn)`, the dev compose plan of the workspace at `root`: the root runway's
 *          `environments.dev.infra` and `lanes` through `devComposeOf`, named after the product key.
 * Boundary: reads `runway.yaml` only; undefined when the workspace has none (nothing to run). A runway that breaks its
 *           schema throws `readRunway`'s error.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 3); ADR 0296 (decision 1); STA-2664 (item 6).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { devComposeOf, type DevComposePlan } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";

/**
 * The dev compose plan of `root` for `lane`.
 *
 * @param root - the workspace root (the folder of the root `runway.yaml`).
 * @param lane - the dev lane.
 * @param optIn - the `when: opt-in` blocks to start too.
 * @example
 * planDevInfra("/work/acme", 0, ["otel-lgtm"])?.env; // { CACHE_VALKEY_URL: "redis://127.0.0.1:6379", … }
 */
export function planDevInfra(
  root: string,
  lane: number,
  optIn: readonly string[],
): DevComposePlan | undefined {
  const file = join(root, "runway.yaml");
  if (!existsSync(file)) return undefined;
  const runway = readRunway(file, "root");
  const dev = runway.environments.dev;
  return devComposeOf({
    project: runway.product?.key ?? runway.project,
    infra: dev?.infra,
    lanes: dev?.lanes,
    lane,
    optIn,
  });
}
