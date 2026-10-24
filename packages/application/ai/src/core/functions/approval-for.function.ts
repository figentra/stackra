/**
 * Stackra file contract:
 * Purpose: `approvalFor`, the default approval of an agent's tool call from its permission's risk level: none at L0
 *          and L1, the user's confirmation at L2, a named human approver at L3 and L4.
 * Boundary: pure. Gen calls it for each row of the tool table and the MCP gateway may call it at run time; the risk is
 *           the permission's, read from the manifest (`L0` to `L4`). Settings may turn off the L2 confirmation per
 *           action; that is the gateway's decision, never this function's, and L3 and L4 never relax.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 5); ADR 0099 (decisions 1 and 4, as amended by ADR 0294); ADR 0155
 *                     (decision 1).
 */
import { Approval } from "#core/enums/approval.enum";

/** A risk level as the manifest writes it. */
const LEVEL = /^L([0-4])$/;

/**
 * The approval a tool call at `risk` needs by default.
 *
 * @param risk - the permission's level, `L0` to `L4`.
 * @returns undefined when the call runs without a person (L0, L1).
 * @throws RangeError for anything but `L0` to `L4`.
 * @example
 * approvalFor("L2"); // Approval.Confirm
 * approvalFor("L3"); // Approval.NamedApprover
 */
export function approvalFor(risk: string): Approval | undefined {
  const level = LEVEL.exec(risk)?.[1];
  if (level === undefined)
    throw new RangeError(`approvalFor: a risk level is L0 to L4, got ${JSON.stringify(risk)}`);
  if (level < "2") return undefined;
  return level === "2" ? Approval.Confirm : Approval.NamedApprover;
}
