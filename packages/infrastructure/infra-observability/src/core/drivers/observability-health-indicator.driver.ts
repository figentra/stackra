/**
 * Stackra file contract:
 * Purpose: `ObservabilityHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`telemetry`): the dependency is
 *          up when the telemetry endpoint the services export to (the runway's OTLP or log ingest URL) answers. One GET, bounded by a timeout; any answer below 500 is `up` (the endpoint is reachable; an unsigned request is refused, as it should be), 429 is `degraded`, 500 and above is `down`.
 * Boundary: a plain subclass of the port (no container dependency here). The target is runway data passed in by the
 *           wiring; no credential is sent and none is read. A failure reports `down` with the host only, never a
 *           response body, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17: each infra package ships its dependency's driver), ADR 0184,
 *                     registry gaps R-27 and R-36.
 */
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

/**
 * Checks that the telemetry endpoint answers.
 *
 * @example
 * const indicator = new ObservabilityHealthIndicatorDriver({ url: "https://in-otel.logs.betterstack.com/" });
 * await indicator.check(); // { status: "up", latency: "PT0.12S" }
 */
export class ObservabilityHealthIndicatorDriver extends HealthIndicator {
  /** The dependency this indicator reports on. */
  override readonly name = "telemetry";

  private readonly url: string;

  private readonly host: string;

  private readonly fetch: typeof fetch;

  private readonly timeout: Duration;

  /**
   * @param options.fetch - the fetch to use; the global one when absent.
   * @param options.timeout - how long a check may take; five seconds when absent.
   * @throws TypeError when the target is malformed.
   */
  constructor(options: {
    readonly url: string;
    readonly fetch?: typeof fetch;
    readonly timeout?: Duration;
  }) {
    super();
    if (!/^https:\/\/[^\s/]+(\/\S*)?$/.test(options.url))
      throw new TypeError(`"${options.url}" is not an https:// URL`);
    this.url = options.url;
    this.host = new URL(this.url).host;
    this.fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.timeout = options.timeout ?? Duration.seconds(5);
  }

  /** One GET against the target. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    try {
      const response = await this.fetch(this.url, {
        method: "GET",
        signal: AbortSignal.timeout(Duration.toMilliseconds(this.timeout)),
      });
      const latency = Duration.seconds((Date.now() - started) / 1000);
      if (response.status >= 500)
        return {
          status: HealthStatus.Down,
          detail: `${this.host} answered ${response.status}`,
          latency,
        };
      if (response.status === 429)
        return { status: HealthStatus.Degraded, detail: `${this.host} is rate limiting`, latency };
      return { status: HealthStatus.Up, latency };
    } catch (error) {
      return {
        status: HealthStatus.Down,
        detail: `${this.host} did not answer (${(error as Error).name})`,
      };
    }
  }
}
