/**
 * Stackra file contract:
 * Purpose: `CreateSynonymAction`, `data_maintenance.synonym.create@1`: add a synonym set for an index and language to the caller's
 *          tenant; also a tool (an action whose actors include a user is one by default).
 * Boundary: single aggregate, inline `handle`. Its permission is `SynonymPermissions.create` (L1); the route is the
 *           convention's `POST /synonyms`. The row belongs to the caller's tenant through the model's `BelongsToTenant`
 *           (never from input), and no search reads it until the next read of that index expands its phrase.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 3, 16 and 21); ADR 0360 (decision 4: tools by default); ADR 0098; ADR 0492
 *                     (decision 5).
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { SynonymPermissions } from "#core/access/synonym.permissions";
import type { CreateSynonymInput } from "#node/schemas/create-synonym-input.schema";
import { CreateSynonymOutput } from "#node/schemas/create-synonym-output.schema";
import type { SynonymService } from "#node/services/synonym.service";

/**
 * Not idempotent (POST): each call adds a set.
 *
 * @example
 * await pipeline.execute(CreateSynonymAction, { indexName: "products", language: "ar", terms: ["كنبة", "أريكة"] }, { actor });
 */
export class CreateSynonymAction extends Action({
  key: "synonym.create",
  permission: SynonymPermissions.create,
  actors: [ActorKind.User, ActorKind.Agent],
  idempotency: Idempotency.Optional,
}) {
  /** Creates the row. */
  private readonly synonyms: SynonymService;

  /**
   * @param synonyms - creates the row.
   */
  constructor(synonyms: SynonymService) {
    super();
    this.synonyms = synonyms;
  }

  /** Creates the set in the caller's tenant. */
  async handle(input: CreateSynonymInput, _ctx: ActionContext): Promise<CreateSynonymOutput> {
    const row = this.synonyms.create({
      indexName: input.indexName,
      language: input.language,
      terms: input.terms,
    });
    return CreateSynonymOutput.create({
      id: row.id,
      indexName: row.indexName,
      language: row.language,
      terms: row.terms,
    });
  }
}
