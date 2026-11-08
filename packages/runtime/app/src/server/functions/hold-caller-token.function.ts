/**
 * Stackra file contract:
 * Purpose: `holdCallerToken`, runs one authenticated call with the user's access token it may forward held for exactly
 *          that call, so the service-to-service calls it makes send it in `Stackra-On-Behalf-Of`
 *          (`ServiceClientSessionDriver`): the bearer token itself when the caller is a user (the first hop), or the
 *          token a service forwarded for its user when the action declares `onBehalfOf: { secondHop: true }`.
 * Boundary: internal; `serveGuardedCall` is its one caller, with the `actor` `CallAuthenticator` derived from these
 *           same `headers`; nothing here verifies a token. A hand-written controller (no action) holds only a first
 *           hop's user bearer, never a forwarded token. Any other caller (an anonymous, agent, job or system call, a service
 *           acting alone, or a service acting for a user through an action without the second hop) holds nothing, so
 *           a second hop is impossible by construction. The token is never put on the actor, the call's options, its
 *           context, a log, an error or an event: it lives only in `ON_BEHALF_OF_TOKEN`'s run, emptied when `work`
 *           settles, so work the call left running reads nothing after it ends.
 * Runtime: node
 * Governing contract: ADR 0209 (decision 3 and its 2026-11-07 amendment, conditions 4 and 5); ADR 0098 (the actor from
 *                     the credential).
 */
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import { ON_BEHALF_OF_TOKEN } from "#server/constants/on-behalf-of-token.constant";

/** `Bearer <token>`, any case of the scheme (RFC 7235). */
const BEARER = /^bearer +(\S+)$/i;

/** A call's headers: a fetch `Headers`, or a record by name as Encore's request metadata gives them. */
type CallHeaders = Headers | Readonly<Record<string, string | readonly string[] | undefined>>;

/** The one value of header `name` (any case); undefined when absent or sent more than once. */
function headerOf(headers: CallHeaders, name: string): string | undefined {
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  const found = Object.entries(headers).filter(([key]) => key.toLowerCase() === name);
  const values = found.flatMap(([, value]) => (value === undefined ? [] : [value].flat()));
  return values.length === 1 ? values[0] : undefined;
}

/** Whether `action` declares `onBehalfOf: { secondHop: true }`; a controller (no action) never does. */
function allowsSecondHop(action: object | undefined): boolean {
  if (action === undefined) return false;
  const options = kindOf(action)?.options["onBehalfOf"] as { secondHop?: unknown } | undefined;
  return options?.secondHop === true;
}

/** The token the call may forward, by the rule in the file contract. */
function forwardable(
  headers: CallHeaders,
  actor: Actor,
  action: object | undefined,
): string | undefined {
  if (actor.kind === ActorKind.User && actor.onBehalfOf === undefined)
    return BEARER.exec(headerOf(headers, "authorization")?.trim() ?? "")?.[1];
  if (
    actor.kind === ActorKind.Service &&
    actor.onBehalfOf?.kind === ActorKind.User &&
    allowsSecondHop(action)
  ) {
    const token = headerOf(headers, "stackra-on-behalf-of")?.trim();
    return token === "" ? undefined : token;
  }
  return undefined;
}

/**
 * Runs `work` with the token `actor`'s call may forward held for it, and empties the holder once `work` settles.
 *
 * @param headers - the call's headers as sent, the ones `CallAuthenticator` verified.
 * @param actor - the verified caller.
 * @param action - the action or query class the call runs; undefined for a controller, which forwards a first hop only.
 * @param work - the call itself.
 * @example
 * // serveGuardedCall, its one caller
 * output = await holdCallerToken(guarded.headers, actor, options.action, () => options.execute(input, actor, guarded));
 */
export async function holdCallerToken<T>(
  headers: CallHeaders,
  actor: Actor,
  action: object | undefined,
  work: () => Promise<T>,
): Promise<T> {
  let held = forwardable(headers, actor, action);
  try {
    return await ON_BEHALF_OF_TOKEN.run(() => held, work);
  } finally {
    held = undefined;
  }
}
