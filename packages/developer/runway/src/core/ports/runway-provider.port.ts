/**
 * Stackra file contract:
 * Purpose: the `RunwayProvider` port: one deploy destination (`encore-cloud`, `eas`) with the four operations of ADR
 *          0352 (plan, apply, verify, rollback) and the read promotion needs (what a target runs now).
 * Boundary: an abstract class that is its own token; each destination's driver is in `@stackra/runway/node`, which
 *           runs the destination's own CLI. A plan is data and runs nothing; apply and rollback change a deployment;
 *           verify and current only read. A failing check reports `down`, it does not throw.
 * Runtime: isomorphic
 * Governing contract: ADR 0352 (decision 3: providers behind one port), ADR 0263 (ports resolve by type), ADR 0294
 *                     (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { DeployRecord } from "#core/types/deploy-record.type";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { DeployTarget } from "#core/types/deploy-target.type";

/** One deploy destination. */
export abstract class RunwayProvider extends Port {
  /** The destination it serves, as `environments.<env>.destinations` names it. */
  abstract readonly destination: string;

  /** The commands that would ship `sha` to `target`; runs nothing. */
  abstract plan(target: DeployTarget, sha: string): readonly DeployStep[];

  /** Ships `sha` to `target`. */
  abstract apply(target: DeployTarget, sha: string): Promise<DeployRecord>;

  /** Whether what `record` shipped serves. */
  abstract verify(target: DeployTarget, record: DeployRecord): Promise<HealthReport>;

  /** Returns `target` to what `to` shipped. */
  abstract rollback(target: DeployTarget, to: DeployRecord): Promise<DeployRecord>;

  /** The commit `target` runs now, or `null` when nothing is deployed there. */
  abstract current(target: DeployTarget): Promise<string | null>;
}
