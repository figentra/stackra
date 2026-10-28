/**
 * Stackra file contract:
 * Purpose: `BridgeOptions`, what `Bridge({...})` takes: the bridge's key within its member (`files.pick_folder`,
 *          prefixed by gen to `platform.files.pick_folder`) and the capability it needs, which gen records in the
 *          manifest's `bridges` section and the client manifest's capability map.
 * Boundary: a type only. The key is written once and locked in `stackra.manifest.json` (ADR 0294 decision 20); a
 *           rename needs `@Renamed(old)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 20, as amended); ADR 0251 (decisions 1 and 2).
 */
import type { PlatformCapability } from "#core/enums/platform-capability.enum";

/** The options of a bridge class. */
export interface BridgeOptions {
  /** The key within the member: `<area>.<verb>`, snake_case segments. */
  readonly key: string;

  /** The capability the bridge provides; the renderer's driver offers it only where the bridge is wired. */
  readonly capability?: PlatformCapability;
}
