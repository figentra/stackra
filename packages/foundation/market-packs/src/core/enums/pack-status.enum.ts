/**
 * Stackra file contract:
 * Purpose: `PackStatus`, where one market-pack version stands: being written, open to sandboxes and early tenants,
 *          in force, or withdrawn. Which markets are open at launch is this data, never a list in code.
 * Boundary: an `Enum.of` value plus the type of the same name. Resolution accepts only the statuses its caller names
 *           (`live` alone unless told otherwise).
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 4); ADR 0294 (decision 16: Enum); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The status of one pack version. */
export const PackStatus = Enum.of({
  /** Being written; never served outside authoring. */
  Draft: "draft",
  /** Open to sandboxes and to tenants who accept beta packs. */
  Beta: "beta",
  /** In force. */
  Live: "live",
  /** Withdrawn; kept for history and audit. */
  Retired: "retired",
});

/** One of the codes above. */
export type PackStatus = Enum.Value<typeof PackStatus>;
