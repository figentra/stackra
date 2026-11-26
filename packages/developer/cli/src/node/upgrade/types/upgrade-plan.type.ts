/**
 * Stackra file contract:
 * Purpose: `UpgradePlan`, what `stackra upgrade` will do before it writes anything: the versions it moves between,
 *          the codemods it runs, the manifest edits of the version bump and the service folders its steps run in.
 * Boundary: type only; `planUpgrade` builds it.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";
import type { UpgradeFileEdit } from "#node/upgrade/types/upgrade-file-edit.type";

/** An upgrade, planned. */
export type UpgradePlan = {
  /** The version the workspace is on: `--from`, else its oldest `@stackra/*` pin. */
  readonly from: string;

  /** The version it moves to. */
  readonly to: string;

  /** The codemods to run, oldest release first. */
  readonly codemods: readonly UpgradeCodemod[];

  /** The package.json and pnpm-workspace.yaml edits that move the pins. */
  readonly manifests: readonly UpgradeFileEdit[];

  /** The service folders, relative to the root. */
  readonly services: readonly string[];
};
