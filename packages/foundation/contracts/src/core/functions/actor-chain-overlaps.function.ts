/**
 * Stackra file contract:
 * Purpose: `actorChainOverlaps(a, b)`, the one check of whether two actors share a principal in their `onBehalfOf`
 *          chains: the same principal, an agent acting for the other, or the human an agent acts for.
 * Boundary: pure and id-only. It knows nothing of people with several ids; `actorsSharePerson` adds that check on top.
 *           `approverRefusal` (actions) calls it, and the settings resolver adopts it (STA-1724 phase 4); neither keeps
 *           a chain walk of its own.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (self-approval); ADR 0360 (an agent never approves its own call); STA-1724 L-07.
 */
import type { Actor } from "#core/types/actor.type";

/** Every principal id in `actor`'s chain, itself first. */
function chainOf(actor: Actor): readonly string[] {
  const ids: string[] = [];
  for (let link: Actor | undefined = actor; link !== undefined; link = link.onBehalfOf)
    ids.push(link.id);
  return ids;
}

/**
 * Whether any principal id in `a`'s chain is in `b`'s chain.
 *
 * @example
 * actorChainOverlaps(agentActingForSara, sara); // true
 * actorChainOverlaps(sara, omar); // false
 */
export function actorChainOverlaps(a: Actor, b: Actor): boolean {
  const others = new Set(chainOf(b));
  return chainOf(a).some((id) => others.has(id));
}
