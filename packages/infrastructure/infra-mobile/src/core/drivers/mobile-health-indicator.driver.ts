/**
 * Stackra file contract:
 * Purpose: `MobileHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`eas`): the dependency is
 *          up when the EAS update endpoint of the app's Expo project answers, so installed apps can fetch updates. One GET, bounded by a timeout; any answer below 500 is `up` (the endpoint is reachable; an unsigned request is refused, as it should be), 429 is `degraded`, 500 and above is `down`.
 * Boundary: `Driver(HealthIndicator)`, so the container records the port it implements. The target is runway data passed in by the
 *           wiring; no credential is sent and none is read. A failure reports `down` with the host only, never a
 *           response body, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17: each infra package ships its dependency's driver), ADR 0180, ADR 0344,
 *                     registry gaps R-27 and R-36.
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

/**
 * The `eas` health indicator: probes the dependency with one bounded GET and maps the answer to a status.
 *
 * @example
 * const indicator = new MobileHealthIndicatorDriver({ projectId: "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0" });
 * await indicator.check(); // { status: "up", latency: "PT0.12S" }
 */
export class MobileHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The indicator's name in a health report. */
  override readonly name = "eas";

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
    readonly projectId: string;
    readonly fetch?: typeof fetch;
    readonly timeout?: Duration;
  }) {
    super();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(options.projectId))
      throw new TypeError(`"${options.projectId}" is not an Expo project id (a UUID)`);
    this.url = `https://u.expo.dev/${options.projectId}`;
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
