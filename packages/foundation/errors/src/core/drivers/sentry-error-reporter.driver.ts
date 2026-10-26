/**
 * Stackra file contract:
 * Purpose: the Sentry driver of the `ErrorReporter` port (driver name `sentry`): each reported error becomes one
 *          Sentry envelope POSTed to the project of the DSN secret, sampled by `SentryConfig.sampleRate`.
 * Boundary: no vendor SDK (ADR 0147 decision 1): web-standard `fetch` and `crypto` only, so it runs in a service, a
 *           Worker and a browser. The DSN is read once through the `SecretStore` port by the name `dsnSecret`; with
 *           no value, or a malformed one, nothing is sent. `report` never throws and never awaits: a failed send is
 *           dropped, so reporting cannot add a second failure. `flush()` waits for the sends in flight (call it before
 *           a process exits).
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 6: Sentry handles crash reports, no personal data); ADR 0147 (decision 1: no
 *                     vendor SDK in packages); ADR 0173 (secrets by name); ADR 0294 (decision 16).
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import type { SentryConfig } from "#config/sentry.config";
import { ErrorReporter } from "#contracts/ports/error-reporter.port";
import { sentryEnvelope } from "#core/functions/sentry-envelope.function";
import { sentryTarget } from "#core/functions/sentry-target.function";
import type { SentryTarget } from "#core/types/sentry-target.type";

/** The client name Sentry records for this reporter. */
const CLIENT = "stackra-errors/1.0";

/**
 * Reports errors to Sentry.
 *
 * @example
 * // runway.yaml (production): config.errors.sentry: { environment: production, sampleRate: 1 }
 * reporter.report(error);
 * await reporter.flush();
 */
export class SentryErrorReporterDriver extends Driver(ErrorReporter) {
  private readonly config: SentryConfig;

  private readonly secrets: SecretStore;

  private readonly clock: Clock;

  /** The parsed DSN; `null` once read and found missing or malformed. */
  private target: SentryTarget | null | undefined;

  private readonly inFlight = new Set<Promise<void>>();

  /**
   * @param config - the DSN secret's name, the tags and the sampling rate.
   * @param secrets - the store the DSN is read from.
   * @param clock - the time each report carries.
   */
  constructor(config: SentryConfig, secrets: SecretStore, clock: Clock) {
    super();
    this.config = config;
    this.secrets = secrets;
    this.clock = clock;
  }

  /** Sends `error` to Sentry when the DSN is set and the sample keeps it. */
  report(error: unknown): void {
    try {
      const target = this.resolve();
      if (target === null || Math.random() >= this.config.sampleRate) return;
      const eventId = globalThis.crypto.randomUUID().replaceAll("-", "");
      const body = sentryEnvelope(error, {
        eventId,
        at: this.clock.now(),
        dsn: target.dsn,
        environment: this.config.environment,
        release: this.config.release,
      });
      const sent = globalThis
        .fetch(target.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/x-sentry-envelope",
            "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${target.key}, sentry_client=${CLIENT}`,
          },
          body,
        })
        .then(
          () => undefined,
          () => undefined,
        );
      this.inFlight.add(sent);
      void sent.finally(() => this.inFlight.delete(sent));
    } catch {
      // Reporting never fails its caller.
    }
  }

  /** Resolves once every send started so far has finished or failed. */
  async flush(): Promise<void> {
    await Promise.all(this.inFlight);
  }

  /** The target, read from the secret on first use. */
  private resolve(): SentryTarget | null {
    if (this.target === undefined) {
      const dsn = this.secrets.get(this.config.dsnSecret);
      this.target = (dsn === undefined ? undefined : sentryTarget(dsn)) ?? null;
    }
    return this.target;
  }
}
