/**
 * Stackra file contract:
 * Purpose: `IdentityHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`identity`): the dependency is
 *          up when the ZITADEL instance's OpenID discovery document is served: the issuer every sign-in starts from. One GET, bounded by a timeout; a non-2xx answer is `down`.
 * Boundary: `Driver(HealthIndicator)`, so the container records the port it implements. The target is `InfraIdentityConfig`, runway data the
 *           wiring injects; no credential is sent and none is read. A failure reports `down` with the host only, never a
 *           response body, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17: each infra package ships its dependency's driver), ADR 0206,
 *                     registry gaps R-27 and R-36.
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { InfraIdentityConfig } from "#config/infra-identity.config";

/**
 * The `identity` health indicator: probes the dependency with one bounded GET and maps the answer to a status.
 *
 * @example
 * const indicator = new IdentityHealthIndicatorDriver(buildConfig(InfraIdentityConfig, { values: { domain: "id.acme.example" } }));
 * await indicator.check(); // { status: "up", latency: "PT0.12S" }
 */
export class IdentityHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The indicator's name in a health report. */
  override readonly name = "identity";

  private readonly url: string;

  private readonly host: string;

  private readonly timeout = Duration.seconds(5);

  /**
   * @param config - the target, from the runway's `config.infra_identity`.
   * @throws TypeError when the target is malformed or unset.
   */
  constructor(config: InfraIdentityConfig) {
    super();
    if (
      !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(config.domain)
    )
      throw new TypeError(`"${config.domain}" is not a host name without a scheme`);
    this.url = `https://${config.domain}/.well-known/openid-configuration`;
    this.host = new URL(this.url).host;
  }

  /** One GET against the target. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    try {
      const response = await fetch(this.url, {
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
