/**
 * Stackra file contract:
 * Purpose: `publicOf`, what an API key must hold to call an operation declared `public`: the scopes (`public.scopes`,
 *          else the operation's permission) and whether only exact keys count (an operation at L3 or above, or one with
 *          approval or step-up, never yields to a selector).
 * Boundary: pure; `undefined` for an operation that is not `public`. An operation with no permission and no scopes
 *           requires nothing a key could hold, so it answers an empty list and the access check refuses it.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (amendment of 2026-11-09, CHECKOUT's R1); STA-2646.
 */
import type { CallPublic } from "#contracts/types/call-public.type";
import type { ActionPublic } from "#core/types/action-public.type";

/** The risk at and above which a selector on a key never covers an operation. */
const EXACT_FROM = 3;

/**
 * The requirement of an operation's `public` option.
 * @example
 * publicOf({ public: true }, "payments.payment.read", "L1"); // { scopes: ["payments.payment.read"], exactOnly: false }
 */
export function publicOf(
  options: {
    readonly public?: ActionPublic;
    readonly approval?: unknown;
    readonly stepUp?: unknown;
  },
  permission: string | undefined,
  risk: string | undefined,
): CallPublic | undefined {
  const open = options.public;
  if (open === undefined) return undefined;
  const named = open === true ? undefined : open.scopes;
  const scopes = named ?? (permission === undefined ? [] : [permission]);
  const level = Number(/\d/.exec(risk ?? "")?.[0] ?? Number.NaN);
  const gated =
    (options.approval !== undefined && options.approval !== false) || options.stepUp !== undefined;
  return Object.freeze({
    scopes: Object.freeze([...scopes]),
    exactOnly: gated || !(level < EXACT_FROM),
  });
}
