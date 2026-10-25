/**
 * Stackra file contract:
 * Purpose: `ServerApp`, what `createApp` from `@stackra/app/server` resolves to and the generated Encore app imports:
 *          the member key, readiness, the health probe, drain, close and the handlers.
 * Boundary: a type only. Whether the member runs alone, in a group or in a monolith is root runway topology, never a
 *           field here (ADR 0295 decision 9).
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 7 to 9).
 */
import type { ProbeAnswer } from "#server/types/probe-answer.type";
import type { ServerHandlers } from "#server/types/server-handlers.type";

/** A running server member. */
export interface ServerApp {
  /** The member key (`commerce`). */
  readonly key: string;

  /** True from boot until a drain starts: the readiness probe. */
  ready(): boolean;

  /** Refuses new calls and resolves once every call in flight has settled; idempotent. */
  drain(): Promise<void>;

  /** Drains, then shuts the container down (each instance's `onApplicationShutdown`, last built first); idempotent. */
  close(): Promise<void>;

  /** Answers `GET /healthz` and `GET /readyz`; `undefined` for any other route. */
  probe(method: string, path: string): Promise<ProbeAnswer | undefined>;

  /** What the generated adapters call. */
  readonly handlers: ServerHandlers;
}
