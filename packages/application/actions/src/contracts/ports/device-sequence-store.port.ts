/**
 * Stackra file contract:
 * Purpose: the `DeviceSequenceStore` port: where the pipeline keeps each device's last settled sequence, so it applies
 *          one device's queued calls in order and the server can list what a device last had acknowledged.
 * Boundary: an abstract class that is its own token. A device's sequences are strictly increasing but not contiguous
 *           (the client stamps each call when it is first sent), so `settle` only ever moves a device forward: a
 *           sequence at or below the last changes nothing. This package ships the memory driver; a durable driver
 *           comes through `@stackra/database`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4); ADR 0263 (ports are classes).
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import type { DeviceSequence } from "#contracts/types/device-sequence.type";

/**
 * Keeps each device's last settled sequence.
 *
 * @example
 * const last = (await store.last(deviceId))?.sequence ?? 0;
 * if (sequence > last) await store.settle(deviceId, sequence, new Date(), scope);
 */
export abstract class DeviceSequenceStore extends Port {
  /** The device's last settled call; `undefined` when it has settled none. */
  abstract last(deviceId: string): Promise<DeviceSequence | undefined>;

  /** Records `sequence` as settled at `at` in `scope` when it is above the last; otherwise does nothing. */
  abstract settle(
    deviceId: string,
    sequence: number,
    at: Date,
    scope: ScopeRef | undefined,
  ): Promise<void>;
}
