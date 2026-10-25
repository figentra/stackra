/**
 * Stackra file contract:
 * Purpose: the service-level indicators every service gets (ADR 0184 decision 3): availability, the share of its
 *          HTTP requests answered without a server error, and latency, the request duration at fixed quantiles.
 * Boundary: an `Enum.of` value plus the type of the same name. An indicator is a measurement, not a target: the
 *           objectives (SLOs) start at the first paying tenant and are not modelled here.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 3), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** What an indicator measures. */
export const SliKind = Enum.of({
  /** The share of requests whose `http.response.status_code` is below 500. */
  Availability: "availability",
  /** The request duration at the 95th and 99th percentiles. */
  Latency: "latency",
});

/** One of the codes above. */
export type SliKind = Enum.Value<typeof SliKind>;
