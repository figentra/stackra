/**
 * Stackra file contract:
 * Purpose: `TestbedCommand`, `stackra testbed <verb>`: runs heavy work on the shared test boxes (`run`) and manages them
 *          (`status`, `unlock`, `ip`, `ssh`, `sync`, `scale`, `image`). `--json`: `run`'s result or `status`'s regions,
 *          the job's own output on standard error. The body is `TESTBED_COMMAND`, unchanged; deprecated for
 *          `testbed` from @figentra/testbed (ADR 0522).
 * Boundary: starts `aws`, `ssh`, `rsync` and `gh` without a shell (the body's `TestbedDeps`); never prints a secret.
 * Runtime: node
 * Governing contract: ADR 0484; ADR 0522; ADR 0282 (decision 3); ADR 0506; ADR 0500 (decision 7); STA-2883.
 */
import { Argument, Command, Option, type CommandIo } from "@stackra/console";
import { List, Str } from "@stackra/validation";

import { TESTBED_COMMAND } from "#node/constants/testbed-command.constant";
import { runBody } from "#node/functions/run-body.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** Runs work on the test boxes and manages them. */
export class TestbedCommand extends Command({
  name: "testbed",
  description: TESTBED_COMMAND.summary,
  group: "Repository",
  bin: true,
  examples: [
    "stackra testbed status",
    'stackra testbed run "lane-3 verify" . "pnpm verify" --json',
  ],
}) {
  /** The body it runs, unchanged; every option the body reads is a field here. */
  static readonly body: CliCommand = TESTBED_COMMAND;

  /** run, status, unlock, ip, ssh, sync, scale or image */
  @Argument({
    description: "run, status, unlock, ip, ssh, sync, scale or image",
    optional: true,
  })
  @Str
  verb?: string;

  /** The verb's arguments (run: \"<session> <what>\" <dir> \"<cmd>\") */
  @Argument({ description: 'The verb\'s arguments (run: "<session> <what>" <dir> "<cmd>")' })
  @List
  args: string[] = [];

  /** A box: its number or instance id */
  @Option({ description: "A box: its number or instance id" })
  @Str
  box?: string;

  /** The slot: heavy or light */
  @Option({ description: "The slot: heavy or light" })
  @Str
  slot?: string;

  /** run: a GitHub fallback preset (verify, e2e or integration) */
  @Option({ description: "run: a GitHub fallback preset (verify, e2e or integration)" })
  @Str
  preset?: string;

  /** run: the ref the preset runs */
  @Option({ description: "run: the ref the preset runs" })
  @Str
  ref?: string;

  /** run: start an on-demand box when none is free */
  @Option({ description: "run: start an on-demand box when none is free" })
  onDemand = false;

  /** run: start Postgres on the box first */
  @Option({ description: "run: start Postgres on the box first" })
  postgres = false;

  /** Reach the box over SSH directly, not through SSM */
  @Option({ description: "Reach the box over SSH directly, not through SSM" })
  sshDirect = false;

  /** The AWS profile */
  @Option({ description: "The AWS profile" })
  @Str
  profile?: string;

  /** One region to use. */
  @Option({ description: "One region" })
  @Str
  region?: string;

  /** The enabled regions, comma-separated (default: STACKRA_TESTBED_REGIONS) */
  @Option({
    description: "The enabled regions, comma-separated (default: STACKRA_TESTBED_REGIONS)",
  })
  @Str
  regions?: string;

  /** Wait for a free box. */
  @Option({ description: "run: wait for a free box (--no-wait fails at once)" })
  wait = true;

  /** The SSH key. */
  @Option({
    description: "The SSH key file",
    secret: false,
  })
  @Str
  key?: string;

  /** Runs the verb; the exit code is the body's. */
  handle(io: CommandIo): Promise<number> {
    return runBody(io, TESTBED_COMMAND, {
      values: {
        box: this.box,
        slot: this.slot,
        preset: this.preset,
        ref: this.ref,
        "on-demand": this.onDemand,
        postgres: this.postgres,
        "ssh-direct": this.sshDirect,
        profile: this.profile,
        region: this.region,
        regions: this.regions,
        "no-wait": !this.wait,
        key: this.key,
        json: io.json,
      },
      positionals: [this.verb, ...this.args].filter((word): word is string => word !== undefined),
      toData: (output) => JSON.parse(output) as unknown,
    });
  }
}
