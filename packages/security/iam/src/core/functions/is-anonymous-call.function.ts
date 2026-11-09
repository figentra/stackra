/**
 * Stackra file contract:
 * Purpose: `isAnonymousCall`, whether a call is an anonymous caller's call of a class that lets anonymous callers in.
 * Boundary: internal to the access-control drivers; reads the class's `actors` option from the kind registry.
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294 and 0263); ADR 0138 (as amended: the record policy runs inside
 *                     `handle`); STA-2025.
 */
import type { CallDescriptor } from "@stackra/actions/contracts";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";

/**
 * Whether `call` is an anonymous caller's call of a class that opts into anonymous callers (its `actors` list
 * `ActorKind.Anonymous`): the one call the permission step lets through. Its record policy still runs (STA-2025, as
 * amended 2026-11-09). A signed-in caller of the same class is checked as usual, and a call with no permission (never
 * registered) is refused.
 */
export function isAnonymousCall(call: CallDescriptor): boolean {
  const actors = kindOf(call.type)?.options["actors"];
  return (
    call.actor.kind === ActorKind.Anonymous &&
    Array.isArray(actors) &&
    actors.includes(ActorKind.Anonymous)
  );
}
