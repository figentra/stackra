/**
 * Stackra file contract:
 * Purpose: `LoadTarget`, a running load target: the base URL k6 drives, the server-side latency of each scenario so far
 *          and how to stop it.
 * Boundary: type only; `serveLoadTarget` returns it.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import type { LatencySummary } from "#node/latency/latency-summary.type";

/** A load target serving its scenarios on the loopback interface. */
export type LoadTarget = {
  /** The base URL, `http://127.0.0.1:<port>`; a scenario is `POST <url>/scenarios/<name>`. */
  readonly url: string;

  /**
   * The server-side latency of scenario `name` since the target started.
   *
   * @throws Error when the target serves no scenario `name`.
   */
  readonly latency: (name: string) => LatencySummary;

  /** Stops accepting requests and resolves once the open connections are closed. */
  readonly close: () => Promise<void>;
};
