/**
 * Stackra file contract:
 * Purpose: `SupportMailboxHealthIndicatorDriver`, the example health check of the "Observability" guide: `/readyz`
 *          reports `support_mailbox` up when the mailbox answers within two seconds, and down otherwise, so a deploy
 *          whose mailbox is unreachable is not marked ready.
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound indicators. It never throws; its detail
 *           names the error type only, and the probe's answer never carries it.
 * Runtime: node
 * Governing contract: ADR 0184 (health and readiness); ADR 0263; STA-2852.
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, type HealthReport, HealthStatus } from "@stackra/contracts";

import type { SupportMailbox } from "./support-mailbox.port";

/** The longest the probe waits for the mailbox. */
const TIMEOUT = Duration.seconds(2);

/** Whether the support mailbox answers. */
export class SupportMailboxHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The probe's name in the `/readyz` body. */
  override readonly name = "support_mailbox";

  /** The mailbox it probes. */
  private readonly mailbox: SupportMailbox;

  /**
   * @param mailbox - the mailbox it probes.
   */
  constructor(mailbox: SupportMailbox) {
    super();
    this.mailbox = mailbox;
  }

  /** Up when the mailbox answers in time, down otherwise. */
  override async check(): Promise<HealthReport> {
    const started = performance.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timed out")), Duration.toMilliseconds(TIMEOUT));
    });
    try {
      await Promise.race([this.mailbox.ping(), late]);
      return {
        status: HealthStatus.Up,
        latency: Duration.seconds((performance.now() - started) / 1000),
      };
    } catch (error) {
      return {
        status: HealthStatus.Down,
        detail: `mailbox unreachable (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
