/**
 * Stackra file contract:
 * Purpose: `DeleteSynonymAction`, `data_maintenance.synonym.delete@1`: remove one of the caller's synonym sets; also a tool by
 *          default.
 * Boundary: single aggregate, inline `handle`. Its permission is `SynonymPermissions.delete` (L2, so the panel asks a
 *           person to confirm and an agent calls the tool only with approval); the route is the convention's
 *           `DELETE /synonyms/:synonymId`. Deleting an unknown id, or another tenant's, is a not-found refusal, never a
 *           silent success.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 2, 3, 16 and 21); ADR 0360 (decision 4: tools by default); ADR 0098; ADR 0099
 *                     (risk); ADR 0492 (decision 5).
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import { SynonymPermissions } from "#core/access/synonym.permissions";
import type { DeleteSynonymInput } from "#node/schemas/delete-synonym-input.schema";
import { DeleteSynonymOutput } from "#node/schemas/delete-synonym-output.schema";
import type { SynonymService } from "#node/services/synonym.service";

/**
 * Idempotent (DELETE) once it succeeds.
 *
 * @example
 * await pipeline.execute(DeleteSynonymAction, { synonymId }, { actor });
 */
export class DeleteSynonymAction extends Action({
  key: "synonym.delete",
  permission: SynonymPermissions.delete,
  actors: [ActorKind.User, ActorKind.Agent],
  idempotency: Idempotency.Optional,
}) {
  /** Removes the row. */
  private readonly synonyms: SynonymService;

  /**
   * @param synonyms - removes the row.
   */
  constructor(synonyms: SynonymService) {
    super();
    this.synonyms = synonyms;
  }

  /**
   * Removes the set.
   *
   * @throws NotFoundError when no set has this id in the caller's tenant.
   */
  async handle(input: DeleteSynonymInput, _ctx: ActionContext): Promise<DeleteSynonymOutput> {
    if ((await this.synonyms.delete({ id: input.synonymId })) === 0) throw NotFoundError.create();
    return DeleteSynonymOutput.create({ synonymId: input.synonymId });
  }
}
