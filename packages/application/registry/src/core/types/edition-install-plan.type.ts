/**
 * Stackra file contract:
 * Purpose: `EditionInstallPlan`, what `planEditionInstall` answers: the modules to install in dependency order, the
 *          contributions that stay inert until the module they enhance is installed, and the issues that stop the plan.
 * Boundary: a type only. A plan with issues installs nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0335 (decision 5); ADR 0350 (decisions 4 and 5).
 */
import type { EditionInstallIssue } from "#core/types/edition-install-issue.type";

/** An edition's install plan. */
export interface EditionInstallPlan {
  /** The modules to install, each after the modules it depends on; already installed ones left out. */
  readonly install: readonly string[];

  /** Planned module → the enhanced modules it waits for, inert until they are installed. */
  readonly inert: Readonly<Record<string, readonly string[]>>;

  /** What stops the plan; empty when it can run. */
  readonly issues: readonly EditionInstallIssue[];
}
