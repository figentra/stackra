/**
 * Stackra file contract:
 * Purpose: `ShowLoginPolicyQuery`, `identity.login_policy.read@1`: the login policy the tenant's identity provider
 *          organisation applies now (its own, or the instance default it inherits): whether a second factor is forced,
 *          the allowed methods, the second factors and external providers offered, so the security settings screen
 *          shows the rules before an administrator changes them.
 * Boundary: read only; a user or a service holding `identity.login_policy.read` (L1). The organisation is the
 *           session's (the call's scope through the host's `IdpOrganizations`), never one named in the request; a
 *           platform call, a scope with no organisation, or one that is not the node the organisation belongs to (a
 *           descendant) is `NotFoundError`. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0207 (decision 1); ADR 0410 (decision 4); ADR 0462; ADR 0294 (decisions 16 and 21);
 *                     STA-2817.
 */
import { Query, type QueryContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import type { IdpAdmin, IdpOrganizations } from "#contracts/index";
import { LoginPolicyOutput } from "#node/schemas/login-policy-output.schema";
import type { ShowLoginPolicyInput } from "#node/schemas/show-login-policy-input.schema";

/**
 * Shows the tenant's login policy.
 *
 * @example
 * const { forceMfa, secondFactors } = await pipeline.execute(ShowLoginPolicyQuery, {}, { actor: admin });
 */
export class ShowLoginPolicyQuery extends Query({
  key: "login_policy.read",
  actors: [ActorKind.User, ActorKind.Service],
  // reason: a tenant's sign-in rules are an administrator's security settings, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /** The scope-to-organisation mapping. */
  private readonly organizations: IdpOrganizations;

  /**
   * @param idp - reads the organisation's login policy.
   * @param organizations - finds the organisation of the call's scope.
   */
  constructor(idp: IdpAdmin, organizations: IdpOrganizations) {
    super();
    this.idp = idp;
    this.organizations = organizations;
  }

  /** The policy of the call's scope's organisation. */
  async handle(_input: ShowLoginPolicyInput, ctx: QueryContext): Promise<LoginPolicyOutput> {
    const organization =
      ctx.scope === undefined ? undefined : await this.organizations.organizationOf(ctx.scope);
    // Only the node the organisation belongs to (the tenant's root) reaches its policy, whatever the host's lookup
    // answers: a grant held at a descendant never reaches the whole tenant (ADR 0294, ADR 0462).
    if (organization === undefined || organization.scopeId !== ctx.scope?.id)
      throw NotFoundError.create();
    const { organizationId } = organization;
    return LoginPolicyOutput.from(await this.idp.getLoginPolicy(organizationId));
  }
}
