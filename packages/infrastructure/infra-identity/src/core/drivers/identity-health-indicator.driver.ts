/**
 * Stackra file contract:
 * Purpose: `IdentityHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`identity`): the dependency is
 *          up when the ZITADEL instance's OpenID discovery document is served: the issuer every sign-in starts from. One GET, bounded by a timeout; a non-2xx answer is `down`.
 * Boundary: `Driver(HealthIndicator)`, so the container records the port it implements. The target is runway data passed in by the
 *           wiring; no credential is sent and none is read. A failure reports `down` with the host only, never a
 *           response body, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17: each infra package ships its dependency's driver), ADR 0206,
 *                     registry gaps R-27 and R-36.
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

/**
 * Checks identity.
 *
 * @example
 * const indicator = new IdentityHealthIndicatorDriver({ domain: "id.acme.example" });
 * await indicator.check(); // { status: "up", latency: "PT0.12S" }
 */
export class IdentityHealthIndicatorDriver extends Driver(HealthIndicator) {
  override readonly name = "identity";

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
    readonly domain: string;
    readonly fetch?: typeof fetch;
    readonly timeout?: Duration;
  }) {
    super();
    if (
      !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(options.domain)
    )
      throw new TypeError(`"${options.domain}" is not a host name without a scheme`);
    this.url = `https://${options.domain}/.well-known/openid-configuration`;
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
      if (!response.ok)
        return {
          status: HealthStatus.Down,
          detail: `${this.host} answered ${response.status}`,
          latency,
        };
      return { status: HealthStatus.Up, latency };
    } catch (error) {
      return {
        status: HealthStatus.Down,
        detail: `${this.host} did not answer (${(error as Error).name})`,
      };
    }
  }
}
