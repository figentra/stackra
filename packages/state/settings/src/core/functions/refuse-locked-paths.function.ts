/**
 * Stackra file contract:
 * Purpose: `refuseLockedPaths`, the lock check every `SettingValueStore` driver runs before it writes: a written path
 *          that a holder above the target locks refuses the whole write.
 * Boundary: pure apart from the throw; the caller passes only the layers above the target, never the target's own,
 *           so a holder may change and relock its own value. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 2: locks); ADR 0307 (rule 22: `lockable`).
 */
import type { SettingLayer } from "#contracts/index";
import { SettingsLockedError } from "#core/errors/settings-locked.error";

/**
 * Refuses the write of `paths` when a layer of `above` locks one of them.
 *
 * @throws SettingsLockedError naming every locked path, each with the field error `settings_locked`.
 * @example
 * refuseLockedPaths(layersAboveTarget, Object.keys(values));
 */
export function refuseLockedPaths(above: readonly SettingLayer[], paths: readonly string[]): void {
  const held = new Set(above.flatMap((layer) => layer.locked));
  const refused = paths.filter((path) => held.has(path));
  if (refused.length > 0)
    throw SettingsLockedError.create(
      { paths: refused },
      { fieldErrors: Object.fromEntries(refused.map((path) => [path, "settings_locked"])) },
    );
}
