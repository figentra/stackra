/**
 * Stackra file contract:
 * Purpose: `TESTBED_COMMAND`, `stackra testbed <verb>`: the shared EC2 test boxes. `run "<session> <what>" <dir> "<cmd>"`
 *          runs a command on a free box under its lock; `status`, `unlock`, `ip`, `ssh`, `sync`, `scale` and `image`
 *          manage them. It replaces the Mac script `ci-box`.
 * Boundary: starts `aws`, `ssh`, `rsync` and `gh` without a shell and never prints or passes a secret value; a job
 *           never runs on the Mac. The work is `runTestbed`.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); ADR 0282 (decision 3).
 */
import { homedir } from "node:os";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { createTestbedDeps } from "#node/functions/create-testbed-deps.function";
import { resolveTestbedSettings } from "#node/functions/resolve-testbed-settings.function";
import { runTestbed } from "#node/functions/run-testbed.function";
import type { CliCommand } from "#node/types/cli-command.type";

const flag = (value: string | boolean | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

/** `stackra testbed`. */
export const TESTBED_COMMAND: CliCommand = {
  name: "testbed",
  summary:
    "Run heavy work on the shared test boxes (run, status, unlock, ip, ssh, sync, scale, image)",
  usage:
    'stackra testbed run "<session> <what>" <dir> "<cmd>" [--preset verify|e2e|integration --ref <ref>] [--no-wait] [--on-demand] | status | unlock [--box N|id] [--slot heavy|light] | ip [--box] | ssh [--box] [cmd] | sync [--box] <dir> | scale [--slot heavy|light] | image',
  options: {
    box: { type: "string" },
    slot: { type: "string" },
    preset: { type: "string" },
    ref: { type: "string" },
    "no-wait": { type: "boolean" },
    "on-demand": { type: "boolean" },
    profile: { type: "string" },
    region: { type: "string" },
    key: { type: "string" },
  },
  positionals: true,
  async run({ cwd, io, values, positionals, rest }) {
    const [verb, ...args] = positionals;
    if (verb === undefined) throw new CliUsageError("name a verb");
    const slot = flag(values["slot"]);
    if (slot !== undefined && slot !== "heavy" && slot !== "light") {
      throw new CliUsageError(`unknown slot: ${slot} (expected heavy or light)`);
    }
    return runTestbed(
      {
        verb,
        args: [...args, ...rest],
        cwd,
        box: flag(values["box"]),
        slot,
        preset: flag(values["preset"]),
        ref: flag(values["ref"]),
        noWait: values["no-wait"] === true,
        onDemand: values["on-demand"] === true,
        settings: resolveTestbedSettings(values, process.env, homedir()),
      },
      createTestbedDeps(cwd, io),
      io,
    );
  },
};
