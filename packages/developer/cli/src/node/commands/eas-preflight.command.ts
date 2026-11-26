/**
 * Stackra file contract:
 * Purpose: `EasPreflightCommand`, `stackra eas-preflight check|record --platform ios|android`: checks a local EAS build may
 *          start (clean tree, the deployed sha, free disk) or records its build id. The body is `EAS_PREFLIGHT_COMMAND`,
 *          unchanged.
 * Boundary: reads git and the disk; `record` appends one line to the record file and writes nothing else.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { Str } from "@stackra/validation";

import { EAS_PREFLIGHT_COMMAND } from "#node/eas-preflight/constants/eas-preflight-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Checks or records a local EAS build. */
export class EasPreflightCommand extends Command({
  name: "eas-preflight",
  description: EAS_PREFLIGHT_COMMAND.summary,
  group: "Repository",
  bin: true,
  examples: [
    "stackra eas-preflight check --platform ios",
    "stackra eas-preflight record --platform android --build-id <id>",
  ],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = EAS_PREFLIGHT_COMMAND;

  /** check (may a local EAS build start) or record (keep its build id) */
  @Argument({
    description: "check (may a local EAS build start) or record (keep its build id)",
    optional: true,
  })
  @Str
  verb?: string;

  /** ios or android */
  @Option({ description: "ios or android" })
  @Str
  platform?: string;

  /** check: the deployed backend sha (default: STACKRA_DEPLOYED_SHA, else origin/main) */
  @Option({
    description:
      "check: the deployed backend sha (default: STACKRA_DEPLOYED_SHA, else origin/main)",
  })
  @Str
  deployedSha?: string;

  /** record: the EAS build id */
  @Option({ description: "record: the EAS build id" })
  @Str
  buildId?: string;

  /** record: the rollout id */
  @Option({ description: "record: the rollout id" })
  @Str
  rolloutId?: string;

  /** record: the EAS build profile */
  @Option({ description: "record: the EAS build profile" })
  @Str
  profile?: string;

  /** Checks or records; the exit code is the body's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, EAS_PREFLIGHT_COMMAND, {
      values: {
        platform: this.platform,
        "deployed-sha": this.deployedSha,
        "build-id": this.buildId,
        "rollout-id": this.rolloutId,
        profile: this.profile,
      },
      positionals: this.verb === undefined ? [] : [this.verb],
    });
  }
}
