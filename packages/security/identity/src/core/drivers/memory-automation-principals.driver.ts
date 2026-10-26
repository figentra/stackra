/**
 * Stackra file contract:
 * Purpose: `MemoryAutomationPrincipalsDriver`, an `AutomationPrincipals` held in memory, for tests and local runs: one
 *          live `service` principal per automation and tenant, revoked ones kept in a set a test can read.
 * Boundary: process-local; never a production store. Ids are `prn_` plus a random token.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2); ADR 0263 (a driver is named by its class: `memory`); STA-1264.
 */
import { Driver } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";

import { AutomationPrincipals } from "#contracts/index";
import type { AutomationPrincipalInput } from "#contracts/index";
import { randomToken } from "#core/functions/random-token.function";

/**
 * Automation principals in memory.
 *
 * @example
 * const principals = new MemoryAutomationPrincipalsDriver();
 * const actor = await principals.mint({ automationId: "aut_1", tenantId: "ten_1", name: "Welcome" });
 */
export class MemoryAutomationPrincipalsDriver extends Driver(AutomationPrincipals) {
  /** `<tenant>:<automation>` to its live principal. */
  readonly live = new Map<string, Actor>();

  /** Revoked principal ids. */
  readonly revoked = new Set<PublicId>();

  /** See `AutomationPrincipals.mint`. */
  async mint(input: AutomationPrincipalInput): Promise<Actor> {
    const key = `${input.tenantId ?? ""}:${input.automationId}`;
    const known = this.live.get(key);
    if (known !== undefined) return known;
    const actor: Actor = {
      kind: ActorKind.Service,
      id: `prn_${randomToken()}`,
      ...(input.tenantId === undefined ? {} : { tenantId: input.tenantId }),
    };
    this.live.set(key, actor);
    return actor;
  }

  /** See `AutomationPrincipals.revoke`. */
  async revoke(principalId: PublicId): Promise<void> {
    for (const [key, actor] of this.live)
      if (actor.id === principalId) {
        this.live.delete(key);
        this.revoked.add(principalId);
      }
  }
}
