/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/locking (the `Locks` service, the memory driver, the busy
 *          refusal, and the configuration with its shape and shipped schema) until `stackra gen` writes the entry
 *          barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The shipped schema is re-exported under its generated name
 *           (`LockingConfig$`). The driver-name list stays internal. The port is `./contracts`'; the Postgres driver
 *           is `./node`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { LockingConfig } from "#config/locking.config";
export { LOCKING_CONFIG_SCHEMA as LockingConfig$ } from "#core/constants/locking-config-schema.constant";
export { MemoryLockDriver } from "#core/drivers/memory-lock.driver";
export { LockUnavailableError } from "#core/errors/lock-unavailable.error";
export { LockingOptions } from "#core/schemas/locking-options.schema";
export { Locks } from "#core/services/locks.service";
