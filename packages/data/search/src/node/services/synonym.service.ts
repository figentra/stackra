/**
 * Stackra file contract:
 * Purpose: `SynonymService`, the standard reads and writes of `Synonym` rows for the synonym actions and query.
 * Boundary: exported by the module for hosts; runs inside the caller's transaction and tenant session. `CrudService`
 *           supplies everything; this class adds nothing, so the model's partner is registered and a host may extend it.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 27); ADR 0305 (partners); ADR 0492 (decision 5).
 */
import { CrudService } from "@stackra/database";

import type { Synonym } from "#node/models/synonym.model";

/**
 * The synonym aggregate's service.
 *
 * @example
 * const sets = await this.synonyms.find({ indexName: "products" });
 */
export class SynonymService extends CrudService<Synonym> {}
