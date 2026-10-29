/**
 * Stackra file contract:
 * Purpose: `BootstrapOperatorAction`, `identity.operator.bootstrap@1`: gives the user with an email a role (the owner
 *          role by default) at the platform node, once, so an environment's first operator exists without anyone
 *          writing SQL; `POST /platform/operators/bootstrap`, what `stackra ops bootstrap-operator` calls.
 * Boundary: platform area; the permission is system-held, so only a service principal acting for no one (the
 *           environment's bootstrap credential) passes, and every user is refused. Finds the user through `IdpAdmin`
 *           (the provider's one user with the email and its Stackra id), checks the role through `RolesAtNode` and
 *           writes it through `RoleGrants`, the IAM service's port; a held role is not written again. `dryRun` writes
 *           nothing. The pipeline writes the audit entry; this adds the user id, role and outcome, never the email.
 *           Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0208 (decisions 1 and 2); ADR 0462; ADR 0237 (the platform area is audited); ADR 0294
 *                     (decisions 16 and 21); STA-1586.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind, ApiArea, HttpMethod, type PublicId, Realm } from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { SystemRole } from "@stackra/iam";
import type { RoleGrants, RolesAtNode } from "@stackra/iam/contracts";
import type { ScopeTree } from "@stackra/scope/contracts";

import { OperatorBootstrapOutcome } from "#contracts/index";
import type { IdpAdmin } from "#contracts/index";
import type { BootstrapOperatorInput } from "#node/schemas/bootstrap-operator-input.schema";
import { BootstrapOperatorOutput } from "#node/schemas/bootstrap-operator-output.schema";

/** The path of the scope tree's root, where an operator's grant is held (ADR 0208 decision 1). */
const PLATFORM_PATH = "platform";

/**
 * Gives an operator a role at the platform node, once.
 *
 * @example
 * const { outcome } = await pipeline.execute(BootstrapOperatorAction, { email: "ops@acme.example" }, { actor: service });
 */
export class BootstrapOperatorAction extends Action({
  key: "operator.bootstrap",
  // reason: `User` only so the route exists for the gateway; the system permission refuses every user
  actors: [ActorKind.Service, ActorKind.User],
  area: ApiArea.Platform,
  endpoint: { method: HttpMethod.Post, path: "/platform/operators/bootstrap" },
  // reason: handing out the platform is never an agent's call
  tool: false,
}) {
  /** Finds the user by email. */
  private readonly idp: IdpAdmin;

  /** The roles the user already holds. */
  private readonly roles: RolesAtNode;

  /** Writes the grant. */
  private readonly grants: RoleGrants;

  /** Finds the platform node. */
  private readonly tree: ScopeTree;

  /**
   * @param idp - finds the user by email.
   * @param roles - the roles the user already holds at the platform node.
   * @param grants - writes the grant (the IAM service's driver).
   * @param tree - finds the platform node.
   */
  constructor(idp: IdpAdmin, roles: RolesAtNode, grants: RoleGrants, tree: ScopeTree) {
    super();
    this.idp = idp;
    this.roles = roles;
    this.grants = grants;
    this.tree = tree;
  }

  /**
   * Looks the user up, then grants the role unless held or a dry run.
   *
   * @throws Error when the scope tree has no platform node.
   */
  async handle(
    input: BootstrapOperatorInput,
    ctx: ActionContext,
  ): Promise<BootstrapOperatorOutput> {
    // Defence in depth: the system permission already refuses users; this action never runs for one.
    if (ctx.actor.kind !== ActorKind.Service || ctx.actor.onBehalfOf !== undefined)
      throw ForbiddenError.create();
    const role = input.role ?? SystemRole.Owner;
    const found = await this.idp.findStackraUserId(input.email);
    if (found === undefined) {
      ctx.audit({ role, outcome: OperatorBootstrapOutcome.NotFound });
      return BootstrapOperatorOutput.create({ outcome: OperatorBootstrapOutcome.NotFound, role });
    }
    const userId = found as PublicId<"usr">;
    const node = await this.tree.byPath(PLATFORM_PATH);
    if (node === undefined) throw new Error("the scope tree has no platform node");
    const scope = { id: node.id, path: node.path };
    const held = await this.roles.of(
      { kind: ActorKind.User, id: userId, realm: Realm.Platform },
      scope,
    );
    let outcome: OperatorBootstrapOutcome;
    if (held.has(role)) outcome = OperatorBootstrapOutcome.AlreadyGranted;
    else if (input.dryRun === true) outcome = OperatorBootstrapOutcome.WouldGrant;
    else
      outcome = (await this.grants.grant(userId, { role, scope, grantedBy: ctx.actor.id }))
        ? OperatorBootstrapOutcome.Granted
        : OperatorBootstrapOutcome.AlreadyGranted;
    ctx.audit({ userId, role, outcome, dryRun: input.dryRun === true });
    return BootstrapOperatorOutput.create({ outcome, role, userId });
  }
}
