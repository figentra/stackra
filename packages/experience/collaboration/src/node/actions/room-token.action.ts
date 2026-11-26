/**
 * Stackra file contract:
 * Purpose: `RoomTokenAction`, `collaboration.room.token@1`: the authenticated endpoint that resolves a room grant. It
 *          finds the document's `@Collaborative` model by its public-id prefix, loads the record in the caller's tenant,
 *          authorises the model's `view` permission on it, requires `LiveCollaborationEntitlement` for the scope, sets
 *          `mayEdit` from the `edit` permission and issues a one-time token through `RealtimeRooms`, bound to that
 *          document and that caller, with the `edit` re-check that drops a member's next edit once the right is revoked.
 * Boundary: the caller is the action's verified actor (its subject for a delegated call), never a field of the input.
 *           The record is read through its repository, so row security and the `VisibilityFilter` apply: an unknown,
 *           another tenant's or an invisible document is `not_found`. The record checks go through the `AccessControl`
 *           port, as `ctx.authorize(record)` does, but with the model's own permissions. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0346 (decisions 3 and 6); ADR 0270 (decision 5); ADR 0294 (decisions 2, 3, 16 and 21);
 *                     ADR 0305 (rule 28); ADR 0098.
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import type { AccessControl, CallDescriptor } from "@stackra/actions/contracts";
import { permissionKey } from "@stackra/container";
import { ActorKind, ApiArea } from "@stackra/contracts";
import { type Repository, repositoryOf } from "@stackra/database";
import type { EntitlementSource } from "@stackra/entitlements";
import {
  EntitlementRequiredError,
  ForbiddenError,
  isRefusal,
  NotFoundError,
} from "@stackra/errors";
import type { RealtimeConfig, RealtimeRooms } from "@stackra/realtime";

import { LiveCollaborationEntitlement } from "#core/access/live-collaboration.entitlement";
import { COLLABORATIVE_MODELS } from "#node/constants/collaborative-models.constant";
import type { RoomTokenInput } from "#node/schemas/room-token-input.schema";
import { RoomTokenOutput } from "#node/schemas/room-token-output.schema";

/**
 * Issues a room token for a collaborative document.
 *
 * @example
 * const { origin, token } = await client.collaboration.room.token({ document: template.id });
 */
export class RoomTokenAction extends Action({
  key: "room.token",
  actors: [ActorKind.User],
  idempotency: Idempotency.Optional,
  // reason: a room token is a live editor's connection credential, not something an agent asks for as a tool call
  tool: false,
}) {
  /** The room hub that issues the token. */
  private readonly rooms: RealtimeRooms;

  /** The realtime origin the browser connects to. */
  private readonly config: RealtimeConfig;

  /** The record checks, as `ctx.authorize(record)` runs them. */
  private readonly access: AccessControl;

  /** The live-collaboration grant. */
  private readonly entitlements: EntitlementSource;

  /**
   * @param rooms - the room hub of this instance.
   * @param config - the realtime config (`origin`).
   * @param access - the pipeline's access control.
   * @param entitlements - where the plan's grants come from.
   */
  constructor(
    rooms: RealtimeRooms,
    config: RealtimeConfig,
    access: AccessControl,
    entitlements: EntitlementSource,
  ) {
    super();
    this.rooms = rooms;
    this.config = config;
    this.access = access;
    this.entitlements = entitlements;
  }

  /**
   * Resolves the grant and issues the token.
   *
   * @throws NotFoundError when the id names no collaborative model, or no record the caller can see in its tenant.
   * @throws ForbiddenError when the caller may not view the record; EntitlementRequiredError when the scope's plan has
   *         no live collaboration.
   */
  async handle(input: RoomTokenInput, ctx: ActionContext): Promise<RoomTokenOutput> {
    const collaborative = COLLABORATIVE_MODELS.get(input.document.split("_", 1)[0] ?? "");
    if (collaborative === undefined) throw NotFoundError.create();
    // reason: `repositoryOf` types its token abstract; the token is a concrete `CrudService` with no dependencies
    const Records = repositoryOf(collaborative.model) as unknown as new () => Repository<{
      readonly id: string;
    }>;
    const record = await new Records().findOneOrFail({ id: input.document });
    const call: CallDescriptor = {
      callId: ctx.callId,
      type: RoomTokenAction,
      kind: "action",
      key: ctx.key,
      actor: ctx.actor,
      area: ApiArea.App,
      ...(ctx.scopeId === undefined ? {} : { scopeId: ctx.scopeId }),
      ...(ctx.scope === undefined ? {} : { scope: ctx.scope }),
    };
    await this.access.authorize({ ...call, permission: permissionKey(collaborative.view) }, record);
    const grant = await this.entitlements.grant(
      LiveCollaborationEntitlement,
      ctx.scope?.id ?? ctx.scopeId,
    );
    if (grant !== true) throw EntitlementRequiredError.create();
    const edit = permissionKey(collaborative.edit);
    // A refusal means no edit right; any other failure is the caller's error now, and a refused update in the room.
    const recheckEdit = (): Promise<boolean> =>
      this.access.authorize({ ...call, permission: edit }, record).then(
        () => true,
        (error: unknown) => {
          if (isRefusal(error, ForbiddenError)) return false;
          throw error;
        },
      );
    const subject = ctx.actor.onBehalfOf ?? ctx.actor;
    const { token } = this.rooms.issueToken({
      session: {
        principalId: subject.id,
        ...(ctx.scopeId === undefined ? {} : { scopeId: ctx.scopeId }),
        ...(subject.realm === undefined ? {} : { realm: subject.realm }),
        permissions: [],
      },
      document: input.document,
      mayEdit: await recheckEdit(),
      recheckEdit,
    });
    return RoomTokenOutput.create({ origin: this.config.origin, token });
  }
}
