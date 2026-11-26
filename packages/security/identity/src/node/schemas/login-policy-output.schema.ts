/**
 * Stackra file contract:
 * Purpose: `LoginPolicyOutput`, what `identity.login_policy.read@1` and `.set@1` answer: the login policy the tenant's
 *          organisation applies, with the external providers and second factors it offers, both always listed.
 * Boundary: a schema; the policy's rules and provider-side ids only, no user and no personal data.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; ADR 0410 (decision 4); STA-2817.
 */
import { Enum } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { IdpSecondFactor } from "#contracts/index";
import type { LoginPolicy } from "#contracts/index";

/**
 * The tenant's login policy.
 *
 * @example
 * return LoginPolicyOutput.from(await idp.getLoginPolicy(organizationId));
 */
export class LoginPolicyOutput extends Schema {
  /** Users may sign in with a username and password. */
  allowUsernamePassword!: boolean;

  /** People may register themselves. */
  allowRegister!: boolean;

  /** Users may sign in through an external identity provider. */
  allowExternalIdp!: boolean;

  /** Every user must set up and use a second factor. */
  forceMfa!: boolean;

  /** Users may sign in with a passkey alone. */
  allowPasswordless!: boolean;

  /** The login page hides "forgot password". */
  hidePasswordReset!: boolean;

  /** The login page does not say whether a username exists. */
  ignoreUnknownUsernames!: boolean;

  /** The provider-side ids of the external providers offered. */
  externalProviderIds!: string[];

  /** The second factors offered. */
  secondFactors!: IdpSecondFactor[];

  /** The output of `policy`, a list it leaves out answered empty. */
  static from(policy: LoginPolicy): LoginPolicyOutput {
    return LoginPolicyOutput.create({
      allowUsernamePassword: policy.allowUsernamePassword,
      allowRegister: policy.allowRegister,
      allowExternalIdp: policy.allowExternalIdp,
      forceMfa: policy.forceMfa,
      allowPasswordless: policy.allowPasswordless,
      hidePasswordReset: policy.hidePasswordReset,
      ignoreUnknownUsernames: policy.ignoreUnknownUsernames,
      externalProviderIds: [...(policy.externalProviderIds ?? [])],
      secondFactors: [...(policy.secondFactors ?? [])],
    });
  }
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    LoginPolicyOutput,
    z.object({
      allowUsernamePassword: z.boolean(),
      allowRegister: z.boolean(),
      allowExternalIdp: z.boolean(),
      forceMfa: z.boolean(),
      allowPasswordless: z.boolean(),
      hidePasswordReset: z.boolean(),
      ignoreUnknownUsernames: z.boolean(),
      externalProviderIds: z.array(z.string().min(1)),
      secondFactors: z.array(z.enum(Enum.values(IdpSecondFactor))),
    }),
  ],
]);
