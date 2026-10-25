/**
 * Stackra file contract:
 * Purpose: `Risk`, the one risk scale, L0 to L4: the level of a permission, which an action or a query takes from the
 *          permission it uses, and which gen copies into the manifest, the generated clients and the MCP metadata.
 * Boundary: an `Enum.of` value plus the type of the same name. Authors never write a level on an action: they write
 *           `Permission.L2` on the permission (`Permission.L2.risk` is `Risk.L2`). Code-change risk (R0 to R3) is a
 *           different scale and never shares this name.
 * Runtime: isomorphic
 * Governing contract: ADR 0099 (decision 1, as amended by 0294); ADR 0305 (rule 28: risk from the permission); ADR
 *                     0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The five levels.
 *
 * @example
 * const confirm = intent.risk === Risk.L3 || intent.risk === Risk.L4;
 */
export const Risk = Enum.of({
  /** Informational: no data read beyond public context. */
  L0: "l0",
  /** Read. */
  L1: "l1",
  /** Reversible write. */
  L2: "l2",
  /** Financial. */
  L3: "l3",
  /** Privileged or destructive. */
  L4: "l4",
});

/** One of the codes above. */
export type Risk = Enum.Value<typeof Risk>;
