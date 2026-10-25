/**
 * Stackra file contract:
 * Purpose: `PackRejection`, why a market pack was refused: its shape, its content hash, its signing key, its
 *          signature, or an overlay chain that loops.
 * Boundary: an `Enum.of` value plus the type of the same name; the `reason` of `PackRejectedError`.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 2 and 3); ADR 0294 (decision 16); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The reason a pack was refused. */
export const PackRejection = Enum.of({
  /** The input is not a signed pack of the right shape. */
  ShapeInvalid: "shape_invalid",
  /** The content does not hash to the hash it carries. */
  HashMismatch: "hash_mismatch",
  /** The signing key is not one of the trusted keys. */
  KeyUnknown: "key_unknown",
  /** The signature does not verify against the trusted key. */
  SignatureInvalid: "signature_invalid",
  /** A pack's `extends` chain comes back to a market already in it. */
  OverlayCycle: "overlay_cycle",
});

/** One of the codes above. */
export type PackRejection = Enum.Value<typeof PackRejection>;
