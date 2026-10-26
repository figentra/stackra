/**
 * Stackra file contract:
 * Purpose: `CloudflareHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`cloudflare`): the dependency is
 *          up when a host on a zone the edge serves answers through Cloudflare. One GET, bounded by a timeout; any answer below 500 is `up` (the endpoint is reachable; an unsigned request is refused, as it should be), 429 is `degraded`, 500 and above is `down`.
 * Boundary: a plain subclass of the port (no container dependency here). The target is runway data passed in by the
 *           wiring; no credential is sent and none is read. A failure reports `down` with the host only, never a
 *           response body, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17: each infra package ships its dependency's driver), ADR 0175,
 *                     registry gaps R-27 and R-36.
 */
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

/**
 * Checks that the Cloudflare edge answers for a host.
 *
 * @example
 * const indicator = new CloudflareHealthIndicatorDriver({ host: "api.acme.example" });
 * await indicator.check(); // { status: "up", latency: "PT0.12S" }
 */
export class CloudflareHealthIndicatorDriver extends HealthIndicator {
  /** The dependency name the health report shows. */
  override readonly name = "cloudflare";

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
    readonly host: string;
    readonly fetch?: typeof fetch;
    readonly timeout?: Duration;
  }) {
    super();
    if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(options.host))
      throw new TypeError(`"${options.host}" is not a host name without a scheme`);
    this.url = `https://${options.host}/`;
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
