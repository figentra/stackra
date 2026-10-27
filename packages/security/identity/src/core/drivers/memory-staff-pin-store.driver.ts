/**
 * Stackra file contract:
 * Purpose: `MemoryStaffPinStoreDriver`, a `StaffPinStore` held in memory, for tests and local runs.
 * Boundary: process-local; never a device store (that is `StorageStaffPinStoreDriver`, in the `secrets` area).
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { StaffPinStore } from "#contracts/index";
import type { StaffPinCredential } from "#contracts/index";

/** The map key of one credential. */
const keyOf = (device: PublicId, principal: PublicId): string => `${device} ${principal}`;

/**
 * PINs held in memory.
 *
 * @example
 * const pins = new MemoryStaffPinStoreDriver();
 */
export class MemoryStaffPinStoreDriver extends Driver(StaffPinStore) {
  /** Device and principal to credential. */
  private readonly credentials = new Map<string, StaffPinCredential>();

  /** The credential, or `undefined`. */
  get(device: PublicId, principal: PublicId): Promise<StaffPinCredential | undefined> {
    return Promise.resolve(this.credentials.get(keyOf(device, principal)));
  }

  /** Stores `credential`, replacing the staff member's previous one. */
  put(credential: StaffPinCredential): Promise<void> {
    const key = keyOf(credential.device, credential.principal);
    this.credentials.set(key, Object.freeze({ ...credential }));
    return Promise.resolve();
  }

  /** Removes one credential. */
  remove(device: PublicId, principal: PublicId): Promise<boolean> {
    return Promise.resolve(this.credentials.delete(keyOf(device, principal)));
  }

  /** The principals with a PIN on `device`. */
  principals(device: PublicId): Promise<readonly PublicId[]> {
    return Promise.resolve(
      [...this.credentials.values()]
        .filter((credential) => credential.device === device)
        .map((credential) => credential.principal),
    );
  }
}
