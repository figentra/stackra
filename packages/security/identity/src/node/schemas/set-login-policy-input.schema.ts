/**
 * Stackra file contract:
 * Purpose: `SetLoginPolicyInput`, the input of the administrator's `identity.login_policy.set@1`: the sign-in rules of
 *          the tenant's organisation (which methods are allowed, whether self-registration is open, whether every user
 *          must use a second factor, what the login page reveals) and, optionally, exactly which external providers
 *          and second factors it offers.
 * Boundary: a schema. It names no organisation, tenant or scope: the action takes those from the session. A list left
 *           out keeps what the organisation offers now. Provider ids are checked against the deployment's configured
 *           ones in the action.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305; ADR 0410 (decision 4); STA-2817.
 */
import { Enum } from "@stackra/contracts";
import { List, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { IdpSecondFactor } from "#contracts/index";

/** The most external providers or second factors one policy lists. */
const MAX_LISTED = 50;

/**
 * The login policy to set.
 *
 * @example
 * await pipeline.execute(SetLoginPolicyAction, { ...policy, forceMfa: true, secondFactors: ["totp", "u2f"] }, { actor });
 */
export class SetLoginPolicyInput extends Schema {
  /** The provider-side ids of the external providers to offer, exactly; absent keeps the current ones. */
  @List({
    max: MAX_LISTED,
    unique: true,
  })
  externalProviderIds?: string[];

  /** The second factors to offer, exactly; absent keeps the current ones. */
  @List({
    max: MAX_LISTED,
    unique: true,
  })
  secondFactors?: IdpSecondFactor[];

  /** Users may sign in with a username and password. */
  allowUsernamePassword!: boolean;

  /** People may register themselves. */
  allowRegister!: boolean;

  /** Users may sign in through an external identity provider. */
  allowExternalIdp!: boolean;

  /** Every user must set up and use a second factor, including those who sign in through an external provider. */
  forceMfa!: boolean;

  /** Users may sign in with a passkey alone. */
  allowPasswordless!: boolean;

  /** The login page hides "forgot password". */
  hidePasswordReset!: boolean;

  /** The login page does not say whether a username exists. */
  ignoreUnknownUsernames!: boolean;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    SetLoginPolicyInput,
    z.object({
      allowUsernamePassword: z.boolean(),
      allowRegister: z.boolean(),
      allowExternalIdp: z.boolean(),
      forceMfa: z.boolean(),
      allowPasswordless: z.boolean(),
      hidePasswordReset: z.boolean(),
      ignoreUnknownUsernames: z.boolean(),
      externalProviderIds: z
        .array(z.string().min(1).max(200))
        .max(MAX_LISTED)
        .refine((ids) => new Set(ids).size === ids.length, { message: "Each provider once" })
        .exactOptional(),
      secondFactors: z
        .array(z.enum(Enum.values(IdpSecondFactor)))
        .max(MAX_LISTED)
        .refine((factors) => new Set(factors).size === factors.length, {
          message: "Each second factor once",
        })
        .exactOptional(),
    }),
  ],
]);
