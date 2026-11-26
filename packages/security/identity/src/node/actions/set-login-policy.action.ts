/**
 * Stackra file contract:
 * Purpose: `SetLoginPolicyAction`, `identity.login_policy.set@1`: a tenant administrator sets how the tenant's people
 *          sign in: forces a second factor for everyone (MFA enforcement), chooses the allowed methods, the second
 *          factors and the external providers offered, and what the login page reveals. It pushes the policy to the
 *          tenant's identity provider organisation, audits the policy before and after, and answers the policy now in
 *          force.
 * Boundary: a user or a service holding `identity.login_policy.set` (L3) with a fresh step-up (`stepUp: aal2`, checked
 *           by the pipeline before `handle`). The organisation is the session's: the call's scope, which the session
 *           settled, mapped by the host's `IdpOrganizations`; nothing in the input names an organisation, tenant or
 *           scope. A platform call (no scope), a scope with no organisation, or one that is not the node the
 *           organisation belongs to (a descendant: a branch grant never sets the whole tenant's policy) is
 *           `NotFoundError`. A policy that would
 *           lock everyone out (no method left, a second factor forced with none offered) or names a provider outside
 *           `IdentityConfig.externalProviders` is `LoginPolicyRejectedError` before any provider write. The audit
 *           (the policy before and the one attempted) is recorded before the provider writes, so a call refused part
 *           way still shows what it tried; it holds the policy's rules and provider-side ids only, no person. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0207 (decision 1: an MFA policy per tenant; step-up for L3); ADR 0410 (decision 4: login
 *                     policies are data pushed through the port); ADR 0206; ADR 0462; ADR 0294 (decisions 16 and 21);
 *                     ADR 0099 (risk); STA-2817.
 */
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind, AssuranceLevel } from "@stackra/contracts";
import type { Json } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";

import type { IdentityConfig } from "#config/identity.config";
import type { IdpAdmin, IdpOrganizations, LoginPolicy } from "#contracts/index";
import { LoginPolicyRejectedError } from "#core/errors/login-policy-rejected.error";
import { loginPolicyRejectionOf } from "#core/functions/login-policy-rejection-of.function";
import { LoginPolicyOutput } from "#node/schemas/login-policy-output.schema";
import type { SetLoginPolicyInput } from "#node/schemas/set-login-policy-input.schema";

/** The audit form of a policy: its rules and lists, JSON-safe. */
function auditOf(policy: LoginPolicyOutput): Json {
  return {
    allowUsernamePassword: policy.allowUsernamePassword,
    allowRegister: policy.allowRegister,
    allowExternalIdp: policy.allowExternalIdp,
    forceMfa: policy.forceMfa,
    allowPasswordless: policy.allowPasswordless,
    hidePasswordReset: policy.hidePasswordReset,
    ignoreUnknownUsernames: policy.ignoreUnknownUsernames,
    externalProviderIds: [...policy.externalProviderIds],
    secondFactors: [...policy.secondFactors],
  };
}

/**
 * Sets the tenant's login policy.
 *
 * @example
 * const policy = await pipeline.execute(SetLoginPolicyAction, { ...rules, forceMfa: true, secondFactors: ["totp"] }, { actor: admin });
 */
export class SetLoginPolicyAction extends Action({
  key: "login_policy.set",
  actors: [ActorKind.User, ActorKind.Service],
  // a policy is desired state and its output holds no secret (gen's `secret_output_kept` reads the
  // `allowUsernamePassword` flag's name as one), so a replay may answer the kept output
  idempotency: Idempotency.Optional,
  stepUp: AssuranceLevel.Aal2,
  // reason: how a whole tenant signs in is an administrator's decision, never an agent's
  tool: false,
}) {
  /** The identity provider. */
  private readonly idp: IdpAdmin;

  /** The scope-to-organisation mapping. */
  private readonly organizations: IdpOrganizations;

  /** The configured external providers, read at call time. */
  private readonly config: IdentityConfig;

  /**
   * @param idp - reads and sets the organisation's login policy.
   * @param organizations - finds the organisation of the call's scope.
   * @param config - the external providers the deployment configures.
   */
  constructor(idp: IdpAdmin, organizations: IdpOrganizations, config: IdentityConfig) {
    super();
    this.idp = idp;
    this.organizations = organizations;
    this.config = config;
  }

  /** Checks the policy, audits before and after, pushes it to the scope's organisation, and answers it. */
  async handle(input: SetLoginPolicyInput, ctx: ActionContext): Promise<LoginPolicyOutput> {
    const organization =
      ctx.scope === undefined ? undefined : await this.organizations.organizationOf(ctx.scope);
    // Only the node the organisation belongs to (the tenant's root) reaches its policy, whatever the host's lookup
    // answers: a grant held at a descendant never reaches the whole tenant (ADR 0294, ADR 0462).
    if (organization === undefined || organization.scopeId !== ctx.scope?.id)
      throw NotFoundError.create();
    const { organizationId } = organization;
    const requested: LoginPolicy = {
      allowUsernamePassword: input.allowUsernamePassword,
      allowRegister: input.allowRegister,
      allowExternalIdp: input.allowExternalIdp,
      forceMfa: input.forceMfa,
      allowPasswordless: input.allowPasswordless,
      hidePasswordReset: input.hidePasswordReset,
      ignoreUnknownUsernames: input.ignoreUnknownUsernames,
      ...(input.externalProviderIds === undefined
        ? {}
        : { externalProviderIds: [...input.externalProviderIds] }),
      ...(input.secondFactors === undefined ? {} : { secondFactors: [...input.secondFactors] }),
    };
    const current = await this.idp.getLoginPolicy(organizationId);
    const reason = loginPolicyRejectionOf(
      requested,
      current,
      Object.values(this.config.externalProviders),
    );
    if (reason !== undefined) throw LoginPolicyRejectedError.create({ reason });
    const before = LoginPolicyOutput.from(current);
    const after = LoginPolicyOutput.from({
      ...requested,
      externalProviderIds: requested.externalProviderIds ?? before.externalProviderIds,
      secondFactors: requested.secondFactors ?? before.secondFactors,
    });
    // Recorded before the provider writes, so a call refused part way still shows the policy it attempted.
    ctx.audit({ before: auditOf(before), after: auditOf(after) });
    await this.idp.setLoginPolicy(organizationId, requested);
    return after;
  }
}
