/**
 * Stackra file contract:
 * Purpose: `RecordingAuditTrailDriver`, the `AuditTrail` the testing pipeline runs every call through: it keeps the
 *          last entry of each call by its id, so `run(...)` hands the call's entry to `RunResult.audit`, and forwards
 *          the entry to the trail the test app bound, if any.
 * Boundary: test only. It never replaces the app's trail: whatever the app binds still records. Because a trail is
 *           always present in a test, the pipeline writes a successful call's entry inside its unit of work, as it does
 *           in an app with the audit installed.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0212 (decision 4); STA-820.
 */
import { Driver } from "@stackra/container";

import { AuditTrail } from "#contracts/index";
import type { AuditEntry } from "#contracts/index";
import type { Resolver } from "#core/index";

/**
 * Keeps each call's audit entry and forwards it.
 *
 * @example
 * const trail = new RecordingAuditTrailDriver(app);
 * new ActionPipeline({ has: (t) => t === AuditTrail || app.has(t), get: (t) => (t === AuditTrail ? trail : app.get(t)) });
 */
export class RecordingAuditTrailDriver extends Driver(AuditTrail) {
  /** The last entry of each call, by call id. */
  private readonly entries = new Map<string, AuditEntry>();

  /** Where the test app's own trail is read from. */
  private readonly app: Resolver;

  /** @param app - the testing app, whose bound `AuditTrail` (if any) receives every entry too. */
  constructor(app: Resolver) {
    super();
    this.app = app;
  }

  /** Keeps `entry` under its call id, then records it on the app's trail. */
  async record(entry: AuditEntry): Promise<void> {
    this.entries.set(entry.call.callId, entry);
    if (this.app.has(AuditTrail)) await this.app.get(AuditTrail).record(entry);
  }

  /** The last entry recorded for `callId`; `undefined` when the call wrote none (a query, a bug). */
  entryOf(callId: string): AuditEntry | undefined {
    return this.entries.get(callId);
  }
}
