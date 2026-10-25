/**
 * Stackra file contract:
 * Purpose: `AiAudience`, whether the fields of a data class may enter an agent's context.
 * Boundary: an `Enum.of` value plus the type of the same name; one of the four effects a data class sets. The reader
 *           of the effect applies it; no product checks a class by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 2 and 4).
 */
import { Enum } from "@stackra/contracts";

/** The AI audience of a class's fields. */
export const AiAudience = Enum.of({
  /** Never in an agent's context. */
  Never: "never",
  /** Only when the tenant turned it on. */
  TenantOptIn: "tenant_opt_in",
  /** Always allowed. */
  Allowed: "allowed",
});

/** One of the codes above. */
export type AiAudience = Enum.Value<typeof AiAudience>;
