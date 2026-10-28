/**
 * Stackra file contract:
 * Purpose: `StoredViewService`, the module service over `StoredView`: the reads and writes `DatabaseViewStoreDriver`
 *          makes, with `update`'s `expectedVersion` for the optimistic concurrency of a shared view.
 * Boundary: a `CrudService` with nothing of its own; gen registers the model from the type argument. Every read ANDs in
 *           the bound visibility filter on top of the tenant policy.
 * Runtime: node
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0305 (rule 5: partner by type argument); ADR 0271 (decision 8).
 */
import { CrudService } from "@stackra/database";

import type { StoredView } from "#node/models/stored-view.model";

/** Reads and writes stored saved views. */
export class StoredViewService extends CrudService<StoredView> {}
