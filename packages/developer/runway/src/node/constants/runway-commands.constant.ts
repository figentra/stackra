/**
 * Stackra file contract:
 * Purpose: `RUNWAY_COMMANDS`, the `runway` binary's commands on @stackra/console (ADR 0506 decision 8): plan, deploy,
 *          promote, rollback, status, validate, drift, `secrets sync`, `env check` and `env orphans`
 *          (STA-2104), and the image step `image:publish` / `image:verify` (STA-609, ADR 0174). No passthrough command is left.
 * Boundary: a frozen list of classes; the binary (`runway.ts`) runs it.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 8); ADR 0352; STA-2100; ADR 0174 (STA-609).
 */
import type { CommandClass } from "@stackra/console";

import { RunwayDeployCommand } from "#node/commands/runway-deploy.command";
import { RunwayDriftCommand } from "#node/commands/runway-drift.command";
import { RunwayEnvCheckCommand } from "#node/commands/runway-env-check.command";
import { RunwayEnvOrphansCommand } from "#node/commands/runway-env-orphans.command";
import { RunwayEvidenceCommand } from "#node/commands/runway-evidence.command";
import { RunwayImagePublishCommand } from "#node/commands/runway-image-publish.command";
import { RunwayImageVerifyCommand } from "#node/commands/runway-image-verify.command";
import { RunwayPlanCommand } from "#node/commands/runway-plan.command";
import { RunwayPromoteCommand } from "#node/commands/runway-promote.command";
import { RunwayRollbackCommand } from "#node/commands/runway-rollback.command";
import { RunwaySecretsDecryptCommand } from "#node/commands/runway-secrets-decrypt.command";
import { RunwaySecretsSyncCommand } from "#node/commands/runway-secrets-sync.command";
import { RunwayStatusCommand } from "#node/commands/runway-status.command";
import { RunwayValidateCommand } from "#node/commands/runway-validate.command";

/** Every `runway` command. */
export const RUNWAY_COMMANDS: readonly CommandClass[] = Object.freeze([
  RunwayPlanCommand,
  RunwayDeployCommand,
  RunwayPromoteCommand,
  RunwayRollbackCommand,
  RunwayStatusCommand,
  RunwayValidateCommand,
  RunwayDriftCommand,
  RunwaySecretsSyncCommand,
  RunwaySecretsDecryptCommand,
  RunwayEnvCheckCommand,
  RunwayEnvOrphansCommand,
  RunwayEvidenceCommand,
  RunwayImagePublishCommand,
  RunwayImageVerifyCommand,
]);
