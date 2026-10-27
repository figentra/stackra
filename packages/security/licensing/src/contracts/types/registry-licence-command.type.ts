/**
 * Stackra file contract:
 * Purpose: `RegistryLicenceCommand`, the commands Figentra OS billing sends to the Stackra registry licence API: issue
 *          (subscription start), renew (renewal), set grants (plan change), suspend (failed payment), resume, revoke
 *          (cancellation or refund), add a token and revoke a token. Each carries the `Idempotency-Key` (the OS event
 *          id), so a retried webhook is applied once.
 * Boundary: a type only; the leaf `./contracts` entry. The `registry` `LicenceIssuer` driver maps each command to its
 *           HTTP call; the Worker validates the body.
 * Runtime: isomorphic
 * Governing contract: ADR 0453 (decision 14); stackra-183 (STA-1335).
 */
import type { RegistryLicenceGrant } from "#contracts/types/registry-licence-grant.type";

/**
 * One licence API command.
 *
 * @example
 * await issuer.apply({ action: "suspend", licenceId, idempotencyKey: event.id });
 */
export type RegistryLicenceCommand =
  | {
      /** `POST /-/stackra/v1/licences`. */
      readonly action: "issue";
      readonly idempotencyKey: string;
      readonly holderRef: string;
      readonly grants: readonly RegistryLicenceGrant[];
      readonly notBefore: string | null;
      readonly expiresAt: string | null;
      /** The first token's label; null issues the licence without a token. */
      readonly tokenLabel: string | null;
    }
  | {
      /** `PATCH /-/stackra/v1/licences/:id` with `expiresAt`. */
      readonly action: "renew";
      readonly idempotencyKey: string;
      readonly licenceId: string;
      readonly expiresAt: string | null;
    }
  | {
      /** `PATCH /-/stackra/v1/licences/:id` with `grants`. */
      readonly action: "setGrants";
      readonly idempotencyKey: string;
      readonly licenceId: string;
      readonly grants: readonly RegistryLicenceGrant[];
    }
  | {
      /** `POST /-/stackra/v1/licences/:id/<action>`. */
      readonly action: "suspend" | "resume" | "revoke";
      readonly idempotencyKey: string;
      readonly licenceId: string;
    }
  | {
      /** `POST /-/stackra/v1/licences/:id/tokens`. */
      readonly action: "addToken";
      readonly idempotencyKey: string;
      readonly licenceId: string;
      readonly tokenLabel: string;
    }
  | {
      /** `DELETE /-/stackra/v1/licences/:id/tokens/:tokenId`. */
      readonly action: "revokeToken";
      readonly idempotencyKey: string;
      readonly licenceId: string;
      readonly tokenId: string;
    };
