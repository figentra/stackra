/**
 * Stackra file contract:
 * Purpose: `MemoryPolicySourceDriver`, a `PolicySource` over a policy held in memory, for tests and local runs: `load`
 *          replaces the whole policy and raises the version, and `snapshot` answers each principal its own rows and
 *          the rows for everyone.
 * Boundary: process-local and unsynchronised; never a production source. It starts empty, so until `load` every
 *           principal holds nothing. iam's testing plugin loads "everyone is owner at the root" into it.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 3); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { Actor, PublicId } from "@stackra/contracts";

import { PolicySource } from "#contracts/index";
import type { PolicySnapshot } from "#contracts/index";
import type { MemoryPolicyState } from "#core/types/memory-policy-state.type";

/** The rows of `rows` for `principal`: its own and those without a principal. */
const rowsOf = <R extends { readonly principal?: PublicId }>(
  rows: readonly R[] | undefined,
  principal: PublicId,
): R[] => (rows ?? []).filter((row) => row.principal === undefined || row.principal === principal);

/**
 * A policy held in memory.
 *
 * @example
 * source.load({ grants: [{ principal: staff.id, role: SystemRole.Staff, scope: root }], roles: { staff: ["orders.*"] } });
 */
export class MemoryPolicySourceDriver extends Driver(PolicySource) {
  /** The policy `load` set last. */
  private state: MemoryPolicyState = {};

  /** Raised by every `load`. */
  private version = 0;

  /** Replaces the whole policy. */
  load(state: MemoryPolicyState): void {
    this.state = state;
    this.version += 1;
  }

  /** The snapshot of `principal`. */
  snapshot(principal: Actor): Promise<PolicySnapshot> {
    const { grants, roles, segments, denies, visibility, fields, breakGlass } = this.state;
    return Promise.resolve({
      version: this.version,
      grants: rowsOf(grants, principal.id),
      roles: roles ?? {},
      segments: rowsOf(segments, principal.id).map((row) => row.segment),
      denies: denies ?? [],
      visibility: visibility ?? [],
      fields: fields ?? [],
      breakGlass: rowsOf(breakGlass, principal.id),
    });
  }
}
