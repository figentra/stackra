/**
 * Stackra file contract:
 * Purpose: `UpdateSynonymAction`, `search.synonym.update@1`: replace the terms of one of the caller's synonym sets; also a
 *          tool by default.
 * Boundary: single aggregate, inline `handle`. Its permission is `SynonymPermissions.update` (L1); the route is the
 *           convention's `PATCH /synonyms/:synonymId`. Only the terms change: the index and language are the set's
 *           identity, so a move is a delete and a create. A set of another tenant is not found (row-level security).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 3, 16 and 21); ADR 0360 (decision 4: tools by default); ADR 0098; ADR 0492
 *                     (decision 5).
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

import { SynonymPermissions } from "#node/access/synonym.permissions";
import type { UpdateSynonymInput } from "#node/schemas/update-synonym-input.schema";
import { UpdateSynonymOutput } from "#node/schemas/update-synonym-output.schema";
import type { SynonymService } from "#node/services/synonym.service";

/**
 * Not idempotent in the HTTP sense (PATCH), though repeating it with the same terms changes nothing more.
 *
 * @example
 * await pipeline.execute(UpdateSynonymAction, { synonymId, terms: ["sofa", "couch", "settee"] }, { actor });
 */
export class UpdateSynonymAction extends Action({
  key: "synonym.update",
  permission: SynonymPermissions.update,
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  /** Loads and changes the row. */
  private readonly synonyms: SynonymService;

  /**
   * @param synonyms - loads and changes the row.
   */
  constructor(synonyms: SynonymService) {
    super();
    this.synonyms = synonyms;
  }

  /**
   * Replaces the terms.
   *
   * @throws NotFoundError when no set has this id in the caller's tenant.
   */
  async handle(input: UpdateSynonymInput, _ctx: ActionContext): Promise<UpdateSynonymOutput> {
    const row = await this.synonyms.update({ id: input.synonymId }, { terms: input.terms });
    return UpdateSynonymOutput.create({
      id: row.id,
      indexName: row.indexName,
      language: row.language,
      terms: row.terms,
    });
  }
}
