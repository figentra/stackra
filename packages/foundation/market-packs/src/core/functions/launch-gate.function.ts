/**
 * Stackra file contract:
 * Purpose: `launchGate`, whether one product may sell under one resolved market: every layer `live`, every checklist
 *          item for that product (or for every product) done, and every entry signed off.
 * Boundary: pure. A checklist item without `product` applies to every product; an item is done when it has `doneAt`.
 *           Resolve with the statuses the gate should see (for example `beta` and `live`) to list what is not live yet.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 8).
 */
import { PackStatus } from "#core/enums/pack-status.enum";
import { packLabel } from "#core/functions/pack-label.function";
import { unreviewed } from "#core/functions/unreviewed.function";
import type { LaunchGate } from "#core/types/launch-gate.type";
import type { ResolvedPack } from "#core/types/resolved-pack.type";

/**
 * The gate of `product` in `resolved`.
 *
 * @example
 * launchGate(resolvePack(packs, "eu-de", { statuses: [PackStatus.Beta, PackStatus.Live] }), "commerce").ready;
 */
export function launchGate(resolved: ResolvedPack, product: string): LaunchGate {
  const notLive: string[] = [];
  const pending: string[] = [];
  const keys: string[] = [];
  for (const layer of resolved.layers) {
    const label = packLabel(layer);
    if (layer.status !== PackStatus.Live) notLive.push(label);
    for (const item of layer.checklist)
      if ((item.product === undefined || item.product === product) && item.doneAt === undefined)
        pending.push(`${label}:${item.id}`);
    for (const key of unreviewed(layer)) keys.push(`${label}:${key}`);
  }
  return {
    ready: notLive.length + pending.length + keys.length === 0,
    notLive,
    pending,
    unreviewed: keys,
  };
}
