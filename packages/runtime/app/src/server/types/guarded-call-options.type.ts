/**
 * Stackra file contract:
 * Purpose: `GuardedCallOptions`, what `serveGuardedCall` needs to answer one inbound HTTP call: the request (body
 *          unread), the body cap, the route template, whether the call lists the anonymous actor, the action it runs,
 *          whether it is raw,
 *          and the three seams the generated adapter fills (`guard`, `authenticate`, `execute`).
 * Boundary: a type only. The seams are functions, so the library depends on neither `@stackra/actions` nor Encore.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: every generated adapter is raw); ADR 0437 (server-check order);
 *                     ADR 0457 (request guards); ADR 0098 (the actor from the credential).
 */
import type { AnyClass } from "@stackra/container";
import type { Actor } from "@stackra/contracts";

import type { CallAuthData } from "#server/types/call-auth-data.type";
import type { CallCredentials } from "#server/types/call-credentials.type";
import type { KeyCallOptions } from "#server/types/key-call-options.type";
import type { VisitorIdentity } from "#server/types/visitor-identity.type";

/** The inputs of one guarded call. */
export interface GuardedCallOptions {
  /** The inbound request as Encore received it; its body is read here, once, under `maxBodyBytes`. */
  readonly request: Request;

  /** The route template (`/orders/:orderId`); its `:name` segments are read from the request path. */
  readonly path: string;

  /** The body cap in bytes (`HttpConfig.maxBodyBytes`); a larger body is answered 413 before any guard. */
  readonly maxBodyBytes: number;

  /** True when the call lists the anonymous actor: with no `Authorization` header it runs as an anonymous visitor. */
  readonly anonymous: boolean;

  /**
   * The action or query class the call runs, which `holdCallerToken` reads for `onBehalfOf: { secondHop: true }`.
   * Absent for a hand-written controller: it may forward a user's own bearer (a first hop), never a forwarded token.
   */
  readonly action?: AnyClass | undefined;

  /** The call's input schema class: its registered schema types the query string of a GET or DELETE (numbers, booleans, arrays). */
  readonly input?: AnyClass | undefined;

  /** True for a hand-written controller: the body is not parsed and `execute` answers a `Response` itself. */
  readonly raw?: boolean;

  /** Runs every request guard on the request carrying the exact body bytes (`app.handlers.guard`). */
  readonly guard: (request: Request) => Promise<void>;

  /** Verifies the credential headers (`CallAuthenticator#authenticate`); throws a refusal when they are bad. */
  readonly authenticate: (
    credentials: CallCredentials,
  ) => Promise<Pick<CallAuthData, "actor" | "call">>;
  /**
   * Who an anonymous call's visitor is (`VisitorIdentityService#resolve`): the id its signed token names, or a new
   * visitor. Absent, every anonymous call is a new visitor.
   */
  readonly visitor?: (request: Request) => Promise<VisitorIdentity>;

  /**
   * Runs the call with its parsed input (`{}` when raw), the verified actor and, for an API key, its call options; a
   * raw call gets the guarded request.
   */
  readonly execute: (
    input: unknown,
    actor: Actor,
    request: Request,
    call: KeyCallOptions | undefined,
  ) => Promise<unknown>;
}
