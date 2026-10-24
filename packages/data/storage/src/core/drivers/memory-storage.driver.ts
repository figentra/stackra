/**
 * Stackra file contract:
 * Purpose: `MemoryStorageDriver`, the `Storage` driver that keeps every area in memory: the driver a test, a server
 *          render and the testing module bind, and the `memory` candidate gen lists for every target.
 * Boundary: nothing survives the instance; expiry, JSON copies and schema checks behave exactly as in a persisted
 *           driver, because it is the same area implementation with no backend.
 * Runtime: isomorphic
 * Governing contract: ADR 0256 (decision 3), ADR 0266 (memory drivers first), ADR 0269 (fakes are real drivers).
 */
import { AreaStorageDriver } from "#core/drivers/area-storage.driver";

/**
 * Storage in memory.
 *
 * @example
 * const app = await createTestingModule(MobileModule).override(Storage, new MemoryStorageDriver()).compile();
 */
export class MemoryStorageDriver extends AreaStorageDriver {
  /** Six empty areas with no backend. */
  constructor() {
    super({});
  }
}
