/**
 * Stackra file contract:
 * Purpose: `StorageStaffPinStoreDriver`, the device's `StaffPinStore`: the till's PIN credentials in the `secrets`
 *          storage area, so PINs are checked offline and kept where the platform protects secrets.
 * Boundary: one key per device and principal under `identity.staff_pin.`; a stored value that does not read as a
 *           credential is treated as absent (and the staff member must enrol again), never trusted.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); ADR 0256 (decision 2: the `secrets` area); owner round 3 #15.
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import type { Storage } from "@stackra/storage/contracts";

import { StaffPinStore } from "#contracts/index";
import type { StaffPinCredential } from "#contracts/index";

/** The key prefix of every credential. */
const PREFIX = "identity.staff_pin.";

/** The key of one credential. */
const keyOf = (device: PublicId, principal: PublicId): string => `${PREFIX}${device}.${principal}`;

/** A credential read back from JSON, or `undefined` when it is not one. */
function credentialOf(value: unknown): StaffPinCredential | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const row = value as Record<string, unknown>;
  const { device, principal, hash, salt, iterations, failures, lockedUntil } = row;
  if (
    typeof device !== "string" ||
    typeof principal !== "string" ||
    typeof hash !== "string" ||
    typeof salt !== "string" ||
    typeof iterations !== "number" ||
    typeof failures !== "number"
  )
    return undefined;
  const until = typeof lockedUntil === "string" ? new Date(lockedUntil) : undefined;
  return {
    device: device as PublicId,
    principal: principal as PublicId,
    hash,
    salt,
    iterations,
    failures,
    ...(until !== undefined && !Number.isNaN(until.getTime()) ? { lockedUntil: until } : {}),
  };
}

/**
 * PINs in the device's `secrets` area.
 *
 * @example
 * const pins = new StorageStaffPinStoreDriver(storage);
 */
export class StorageStaffPinStoreDriver extends Driver(StaffPinStore) {
  /** The device's storage. */
  private readonly storage: Storage;

  /**
   * @param storage - the client storage, whose `secrets` area holds the PINs.
   */
  constructor(storage: Storage) {
    super();
    this.storage = storage;
  }

  /** The credential, or `undefined`. */
  get(device: PublicId, principal: PublicId): Promise<StaffPinCredential | undefined> {
    return Promise.resolve(credentialOf(this.storage.secrets.get(keyOf(device, principal))));
  }

  /** Stores `credential`, replacing the staff member's previous one. */
  put(credential: StaffPinCredential): Promise<void> {
    const { lockedUntil, ...rest } = credential;
    this.storage.secrets.set(keyOf(credential.device, credential.principal), {
      ...rest,
      ...(lockedUntil === undefined ? {} : { lockedUntil: lockedUntil.toISOString() }),
    });
    return Promise.resolve();
  }

  /** Removes one credential. */
  remove(device: PublicId, principal: PublicId): Promise<boolean> {
    const key = keyOf(device, principal);
    const held = this.storage.secrets.has(key);
    this.storage.secrets.delete(key);
    return Promise.resolve(held);
  }

  /** The principals with a readable PIN on `device`. */
  principals(device: PublicId): Promise<readonly PublicId[]> {
    return Promise.resolve(
      this.storage.secrets
        .keys()
        .filter((key) => key.startsWith(`${PREFIX}${device}.`))
        .map((key) => credentialOf(this.storage.secrets.get(key))?.principal)
        .filter((principal): principal is PublicId => principal !== undefined),
    );
  }
}
