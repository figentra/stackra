/**
 * Stackra file contract:
 * Purpose: the `AutomationPrincipals` port: identity mints the principal an automation runs as (ADR 0153 decision 2: an
 *          automation acts as its own principal, never as its publisher) and revokes it when the automation is deleted.
 * Boundary: an abstract class that is its own token, keyed `identity.AutomationPrincipals`. The identity service
 *           implements it over its principals table (`principals.principal.create` / `principal.revoke`, with their
 *           events); `MemoryAutomationPrincipalsDriver` serves tests. Minting is idempotent per automation and tenant,
 *           so publishing again keeps the principal. The minted actor is a `service` actor (ADR 0098 has no automation
 *           kind); its grants are the publisher's choice, checked by `@stackra/workflow`, never this port's.
 * Runtime: isomorphic
 * Governing contract: ADR 0153 (decision 2); ADR 0098 (decisions 6 and 7: the actor model); STA-1264.
 */
import { Port } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";

import type { AutomationPrincipalInput } from "#contracts/types/automation-principal-input.type";

/**
 * Mints and revokes automation principals.
 *
 * @example
 * const principal = await automationPrincipals.mint({ automationId: automation.id, tenantId, name: automation.name });
 * await automations.publish(automation.id, revision, principal, ctx.actor);
 */
export abstract class AutomationPrincipals extends Port {
  /** Type-only port key, so `DriverName<AutomationPrincipals>` narrows to this port's drivers. */
  declare readonly "~key": "identity.AutomationPrincipals";

  /**
   * The principal `input.automationId` runs as in `input.tenantId`: the one minted before while it is live, else a new
   * one.
   *
   * @throws Error when the store cannot be reached; nothing is published without a principal.
   */
  abstract mint(input: AutomationPrincipalInput): Promise<Actor>;

  /** Revokes `principalId`; the next `mint` for its automation mints a new one. An unknown id is not an error. */
  abstract revoke(principalId: PublicId): Promise<void>;
}
