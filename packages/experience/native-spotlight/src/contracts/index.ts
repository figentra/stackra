/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/native-spotlight, the `DeviceSearchIndex` port and the
 *          item type its signature names, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DeviceSearchIndex } from "#contracts/ports/device-search-index.port";
export type { DeviceSearchItem } from "#contracts/types/device-search-item.type";
