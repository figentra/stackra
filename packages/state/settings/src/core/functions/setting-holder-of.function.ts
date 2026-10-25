/**
 * Stackra file contract:
 * Purpose: `settingHolderOf`, the holder a target writes to, named as a `SettingLayer` names it: `user:<id>` for a
 *          user, else the node's path (`""` for none).
 * Boundary: pure. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: holders of the cascade).
 */
import type { SettingTarget } from "#contracts/index";

/**
 * The holder of `target`.
 *
 * @example
 * settingHolderOf({ scope }); // "platform.acme"
 */
export function settingHolderOf(target: SettingTarget): string {
  return target.user === undefined ? (target.scope?.path ?? "") : `user:${target.user}`;
}
