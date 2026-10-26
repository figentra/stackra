/**
 * Stackra file contract:
 * Purpose: test fixture: `FakeProvider`, a `RunwayProvider` that records every call, keeps what each target runs in
 *          memory and answers a verify with the status a test sets per target.
 * Boundary: test only; nothing is run or contacted.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0352 (decision 3).
 */
import { HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import { RunwayProvider } from "#core/ports/runway-provider.port";
import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";

/** A provider that records and remembers. */
export class FakeProvider extends RunwayProvider {
  /** Every call, as `<operation> <target> <sha>`. */
  readonly calls: string[] = [];

  /** What each target runs. */
  readonly running = new Map<string, string>();

  /** The status verify reports per target; `up` when absent. */
  readonly statuses = new Map<string, HealthStatus>();

  constructor(override readonly destination: string) {
    super();
  }

  override plan(target: DeployTarget, sha: string): readonly DeployStep[] {
    return [{ command: "fake", args: [target.id, sha] }];
  }

  override async apply(target: DeployTarget, sha: string): Promise<DeployRecord> {
    this.calls.push(`apply ${target.id} ${sha}`);
    this.running.set(target.id, sha);
    return { target: target.id, sha, reference: `ref-${sha.slice(0, 7)}` };
  }

  override async verify(target: DeployTarget): Promise<HealthReport> {
    return { status: this.statuses.get(target.id) ?? HealthStatus.Up };
  }

  override async rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord> {
    this.calls.push(`rollback ${target.id} ${to.sha}`);
    this.running.set(target.id, to.sha);
    return { ...to };
  }

  override async current(target: DeployTarget): Promise<string | null> {
    return this.running.get(target.id) ?? null;
  }
}
