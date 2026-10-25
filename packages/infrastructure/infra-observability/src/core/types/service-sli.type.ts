/**
 * Stackra file contract:
 * Purpose: `ServiceSli`, one service-level indicator of one service, over the stable OpenTelemetry HTTP server
 *          histogram every service exports through OTLP: availability counts the requests below status 500 against
 *          all requests; latency reads the duration at its quantiles.
 * Boundary: type only; a measurement with no target (the objectives start at the first paying tenant, ADR 0184
 *           decision 3). Backend-neutral: the names are OpenTelemetry's, so the same definition reads Better Stack or
 *           the on-premises LGTM stack.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1 to 3).
 */
import type { SliKind } from "#core/enums/sli-kind.enum";

/** What one indicator of one service measures. */
export type ServiceSli =
  | {
      readonly service: string;
      readonly kind: typeof SliKind.Availability;
      /** The OpenTelemetry instrument: `http.server.request.duration` (its count). */
      readonly metric: string;
      /** The attribute filter a good request matches: `http.response.status_code < 500`. */
      readonly goodWhen: string;
    }
  | {
      readonly service: string;
      readonly kind: typeof SliKind.Latency;
      /** The OpenTelemetry instrument: `http.server.request.duration` (seconds). */
      readonly metric: string;
      /** The quantiles reported, as fractions: `[0.95, 0.99]`. */
      readonly quantiles: readonly number[];
    };
