/**
 * Stackra file contract:
 * Purpose: `FlagTargeting`, which id flags are split by: the consented analytics visitor, the signed-in user or the
 *          active tenant. `FeatureFlagsConfig.targeting` holds one; `FlagReader` sends that id as the subject.
 * Boundary: an `Enum.of` value plus the type of the same name. Its codes are the keys of `FlagSubjects`. The active
 *           tenant is sent as the evaluation's group whatever the targeting.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 3: targeting); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The subjects flags are evaluated for. */
export const FlagTargeting = Enum.of({
  /** The analytics visitor, after consent; the public site's choice, where nobody signs in. */
  Visitor: "visitor",
  /** The signed-in user; the default. */
  User: "user",
  /** The active tenant, so every user of a tenant sees the same values. */
  Scope: "tenant",
});

/** One of the codes above. */
export type FlagTargeting = Enum.Value<typeof FlagTargeting>;
