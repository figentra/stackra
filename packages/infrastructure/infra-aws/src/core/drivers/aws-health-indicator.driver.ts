/**
 * Stackra file contract:
 * Purpose: `AwsHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`aws`): the dependency is
 *          up when the AWS region the foundation runs in: its regional STS endpoint answers. One GET, bounded by a timeout; any answer below 500 is `up` (the endpoint is reachable; an unsigned request is refused, as it should be), 429 is `degraded`, 500 and above is `down`.
 * Boundary: `Driver(HealthIndicator)`, so the container records the port it implements. The target is `InfraAwsConfig`, runway data the
 *           wiring injects; no credential is sent and none is read. A failure reports `down` with the host only, never a
 *           response body, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17: each infra package ships its dependency's driver), ADR 0171, ADR 0172,
 *                     registry gaps R-27 and R-36.
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { InfraAwsConfig } from "#config/infra-aws.config";

/**
 * The `aws` health indicator: probes the dependency with one bounded GET and maps the answer to a status.
 *
 * @example
 * const indicator = new AwsHealthIndicatorDriver(buildConfig(InfraAwsConfig, { values: { region: "me-central-1" } }));
 * await indicator.check(); // { status: "up", latency: "PT0.12S" }
 */
export class AwsHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The indicator's name in a health report. */
  override readonly name = "aws";

  private readonly url: string;

  private readonly host: string;

  private readonly timeout = Duration.seconds(5);

  /**
   * @param config - the target, from the runway's `config.infra_aws`.
   * @throws TypeError when the target is malformed or unset.
   */
  constructor(config: InfraAwsConfig) {
    super();
    if (!/^[a-z]{2}(-[a-z]+)+-\d$/.test(config.region))
      throw new TypeError(`"${config.region}" is not an AWS region such as me-central-1`);
    this.url = `https://sts.${config.region}.amazonaws.com/`;
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
