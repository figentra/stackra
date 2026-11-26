/**
 * Stackra file contract:
 * Purpose: `SloObjective`, one service-level objective of one service as the root runway declares it under
 *          `observability.slos.objectives`: an indicator (availability or latency) and the share of requests that must
 *          be good over the objective window; a latency objective also names the duration a good request stays under.
 * Boundary: type only; pure data in the plan. Backend-neutral: the indicator reads the OpenTelemetry histogram
 *           `http.server.request.duration`, so the same objective drives Prometheus (the LGTM stack) or Better Stack.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 3: objectives start at the first paying tenant).
 */
import type { SliKind } from "#core/enums/sli-kind.enum";

/** What one objective of one service promises. */
export type SloObjective = {
  /** The service member. */
  readonly service: string;
  /** Which indicator the objective holds. */
  readonly kind: SliKind;
  /** The OpenTelemetry instrument both indicators read: `http.server.request.duration`. */
  readonly metric: string;
  /** The share of requests that must be good over the window, as a fraction (`0.999`). */
  readonly target: number;
  /** Latency only: a good request takes at most this many seconds (a bucket bound); `null` for availability. */
  readonly thresholdSeconds: number | null;
};
