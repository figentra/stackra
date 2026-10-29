/**
 * Stackra file contract:
 * Purpose: `IdentityStack`, what the identity slice exports from one instance's stack: the issuer, the staff
 *          organisation and project ids, the client id of every app, the user id of every machine user, and the
 *          first-party client list, and the Apple identity provider's id.
 * Boundary: a type only; ids, never a secret value (no app has a client secret, and machine keys are created by the
 *           owner outside the stack).
 * Runtime: node
 * Governing contract: ADR 0171 (decision 4: `ref:` values from stack config), ADR 0274 (decision 5: first-party
 *                     clients are an explicit list), ADR 0173 (no secret value), STA-1578.
 */
import type { Output } from "@pulumi/pulumi";

/** The slice's outputs. */
export type IdentityStack = {
  /** The OIDC issuer every app of this instance reads (`https://id.staging.acme.example`). */
  readonly issuer: string;
  /** The staff organisation. */
  readonly orgId: Output<string>;
  /** The project the roles and clients belong to. */
  readonly projectId: Output<string>;
  /** Client id by app key: the value a runway's `ref:identity.clients.<app>.<instance>` names. */
  readonly clients: Readonly<Record<string, Output<string>>>;
  /** User id by machine key: the principal its key is issued for. */
  readonly machines: Readonly<Record<string, Output<string>>>;
  /** Every client id above, the gateway's first-party list, exempt from the app-grant check. */
  readonly firstPartyClients: Output<string[]>;
  /**
   * The Apple identity provider's id, what `IdentityConfig.externalProviders.apple` names
   * (`ref:identity.appleIdp.<instance>`), or `null` when the plan turns Apple off.
   */
  readonly appleIdp: Output<string> | null;
};
