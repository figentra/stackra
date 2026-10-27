/**
 * Stackra file contract:
 * Purpose: `CallOriginKind`, the surface a call arrived through: a `storefront` (a shop's public site or app, its
 *          origin-bound key), the `console` (a signed-in operator), an `api_key` (a server-to-server credential) or an
 *          `agent` (an AI agent calling an action as a tool).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The transport sets it on
 *           `CallOptions.origin` from the verified credential, never from request input; the pipeline carries it to the
 *           call descriptor (so the audit entry and every port see it) and to `ctx.origin`. A new kind is an ADR change.
 *           Codes are snake_case machine codes (ADR 0231).
 * Runtime: isomorphic
 * Governing contract: ADR 0456 (decision 1: the request origin); ADR 0231 (snake_case codes); ADR 0136 (decision 1).
 */
import { Enum } from "@stackra/contracts";

/**
 * The surfaces a call can arrive through.
 *
 * @example
 * await pipeline.execute(PlaceOrderAction, input, { actor, origin: { kind: CallOriginKind.Storefront, id: "sfr_1" } });
 */
export const CallOriginKind = Enum.of({
  /** A shop's public storefront, through its origin-bound key. */
  Storefront: "storefront",
  /** The operator console, with a signed-in session. */
  Console: "console",
  /** A server-to-server API key. */
  ApiKey: "api_key",
  /** An AI agent calling the action as a tool. */
  Agent: "agent",
});

/** One of the codes above. */
export type CallOriginKind = Enum.Value<typeof CallOriginKind>;
