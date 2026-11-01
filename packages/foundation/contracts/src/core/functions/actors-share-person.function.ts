/**
 * Stackra file contract:
 * Purpose: `actorsSharePerson(identity, a, b)`, whether two actors are the same human: their chains overlap by id, or
 *          any `usr_` id of one chain and any of the other are one person. Two ids are one person when
 *          `IdentityResolver.personOf` answers the same key; when it answers `null` (no person link yet), when their
 *          verified email or verified phone is equal (`principalOf`).
 * Boundary: the id check is `actorChainOverlaps`. This function lets identity's rejection propagate (it cannot use
 *           `@stackra/errors`); the callers (verify, the memory approval gate) turn it into a retryable unavailable
 *           refusal, so an identity outage refuses the vote and never lets it through. The interim rule catches the
 *           accidental second account, not a deliberate one with other contact details.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (one person, several ids); STA-1724 FR-022; ADR 0134 (resolved, not copied).
 */
import { ActorKind } from "#core/enums/actor-kind.enum";
import { actorChainOverlaps } from "#core/functions/actor-chain-overlaps.function";
import type { IdentityResolver } from "#core/ports/identity-resolver.port";
import type { Actor } from "#core/types/actor.type";
import type { PublicId } from "#core/types/public-id.type";

/** The `usr_` ids in `actor`'s chain. */
function usersOf(actor: Actor): PublicId<"usr">[] {
  const ids: PublicId<"usr">[] = [];
  for (let link: Actor | undefined = actor; link !== undefined; link = link.onBehalfOf)
    if (link.kind === ActorKind.User) ids.push(link.id);
  return ids;
}

/** What identifies one user: a person key, else the verified contact points. */
async function identityOf(
  identity: IdentityResolver,
  id: PublicId<"usr">,
): Promise<{ readonly person: string | null; readonly contacts: readonly string[] }> {
  const person = await identity.personOf(id);
  if (person !== null) return { person, contacts: [] };
  const principal = await identity.principalOf(id);
  return {
    person: null,
    contacts: [
      `email:${principal.email.toLowerCase()}`,
      ...(principal.phone === undefined ? [] : [`phone:${principal.phone}`]),
    ],
  };
}

/**
 * Whether `a` and `b` are the same person.
 *
 * @throws whatever `identity` throws when it cannot answer: the vote must be refused, never allowed.
 * @example
 * if (await actorsSharePerson(identity, voter, call.actor)) throw SelfApprovalError.create();
 */
export async function actorsSharePerson(
  identity: IdentityResolver,
  a: Actor,
  b: Actor,
): Promise<boolean> {
  if (actorChainOverlaps(a, b)) return true;
  const left = usersOf(a);
  const right = usersOf(b);
  if (left.length === 0 || right.length === 0) return false;
  const mine = await Promise.all(left.map((id) => identityOf(identity, id)));
  const theirs = await Promise.all(right.map((id) => identityOf(identity, id)));
  return mine.some((one) =>
    theirs.some(
      (other) =>
        (one.person !== null && one.person === other.person) ||
        one.contacts.some((contact) => other.contacts.includes(contact)),
    ),
  );
}
