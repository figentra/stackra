/**
 * Stackra file contract:
 * Purpose: `disposableIds`, the ids among a set that no legal hold covers: what a purge or a retention job may remove.
 *          The held ones are reported to the registry, which logs each refused attempt.
 * Boundary: asks the connected `HoldRegistry` once; with none connected (or no ids) every id is disposable. It only
 *           ever narrows: an id the registry does not return stays, an id it returns that was not asked about is
 *           ignored. Order is kept. `links` (from `registerHoldLinks`) goes to the registry with the ids when given.
 * Runtime: node
 * Governing contract: ADR 0134 (decision 3 and its 2026-10-24 amendment); ADR 0189 (decision 4); STA-1241 (links).
 */
import type { AnyClass } from "@stackra/container";

import { HOLD_HOST } from "#core/constants/hold-host.constant";
import type { Disposal } from "#contracts/enums/disposal.enum";
import type { HoldLinks } from "#contracts/types/hold-links.type";

/**
 * The ids of `model` that may be disposed of.
 *
 * @example
 * const ids = await disposableIds(AiThread, expired, Disposal.Retention);
 * await threads.purge({ id: { $in: ids } });
 */
export async function disposableIds<M extends object>(
  model: AnyClass<M>,
  ids: readonly string[],
  disposal: Disposal,
  links?: HoldLinks,
): Promise<string[]> {
  const { registry } = HOLD_HOST;
  if (registry === undefined || ids.length === 0) return [...ids];
  const held =
    links === undefined
      ? await registry.heldAmong(model, ids, disposal)
      : await registry.heldAmong(model, ids, disposal, links);
  return ids.filter((id) => !held.has(id));
}
