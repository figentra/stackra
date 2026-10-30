/**
 * Stackra file contract:
 * Purpose: `runTestbed(request, deps, io)`, every `stackra testbed` verb: `run` (claim a slot, prepare the job
 *          directory, rsync into it, run the command under the box's lock, retry on exit 75, 73 and a lost light box,
 *          scale the group when every slot stays busy, dispatch the GitHub fallback), `status`, `unlock`, `ip`, `ssh`,
 *          `sync`, `scale` and `image`. It replaces the Mac script `ci-box`.
 * Boundary: starts only `aws`, `ssh`, `rsync` and `gh`, through `deps`, without a shell; the only text a box shell
 *           sees is single-quoted. It never reads, prints or passes a secret value (the key is a file path), and it
 *           never runs a job on the Mac.
 * Runtime: node
 * Governing contract: ADR 0484 (the testbed); the agent contract in the testbed spec; ADR 0282 (decision 3).
 */
import { basename, resolve } from "node:path";

import { TESTBED_DEFAULTS } from "#node/constants/testbed-defaults.constant";
import { TESTBED_EXIT } from "#node/constants/testbed-exit.constant";
import { TESTBED_POLL_MS } from "#node/constants/testbed-poll-ms.constant";
import { TESTBED_PRESETS } from "#node/constants/testbed-presets.constant";
import { TESTBED_RSYNC_EXCLUDES } from "#node/constants/testbed-rsync-excludes.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { claimTestbedSlot } from "#node/functions/claim-testbed-slot.function";
import { classifyTestbedCommand } from "#node/functions/classify-testbed-command.function";
import { decideTestbedFallback } from "#node/functions/decide-testbed-fallback.function";
import { orderTestbedBoxes } from "#node/functions/order-testbed-boxes.function";
import { parseTestbedBoxes } from "#node/functions/parse-testbed-boxes.function";
import { refusesTestbedCommand } from "#node/functions/refuses-testbed-command.function";
import { releaseTestbedClaim } from "#node/functions/release-testbed-claim.function";
import { shouldScaleTestbed } from "#node/functions/should-scale-testbed.function";
import type { CliIo } from "#node/types/cli-io.type";
import type { TestbedBox } from "#node/types/testbed-box.type";
import type { TestbedDeps } from "#node/types/testbed-deps.type";
import type { TestbedRequest } from "#node/types/testbed-request.type";
import type { ToolOutput } from "#node/types/tool-output.type";

const NOT_STARTED: ToolOutput = { code: 127, stdout: "", stderr: "cannot start" };

/** `value` as one single-quoted word for the box's shell. */
const quote = (value: string): string => `'${value.replaceAll("'", `'\\''`)}'`;

/** A group's desired, maximum and minimum counts, or `undefined` when the group cannot be read. */
type GroupCounts = { readonly desired: number; readonly max: number; readonly min: number };

/**
 * Runs one `stackra testbed` call and resolves with its exit code.
 *
 * @param request - the parsed command line.
 * @param deps - the processes, clock and claim folder.
 * @param io - where the command writes.
 * @example
 * const code = await runTestbed(request, deps, io);
 */
export async function runTestbed(
  request: TestbedRequest,
  deps: TestbedDeps,
  io: CliIo,
): Promise<number> {
  const { settings } = request;
  const say = (text: string): void => io.err(`stackra testbed: ${text}\n`);
  let allowlisted = false;

  const aws = async (args: readonly string[]): Promise<ToolOutput> =>
    (await deps.exec("aws", [
      "--profile",
      settings.profile,
      "--region",
      settings.region,
      ...args,
    ])) ?? NOT_STARTED;

  const listBoxes = async (): Promise<readonly TestbedBox[]> => {
    const out = await aws([
      "ec2",
      "describe-instances",
      "--filters",
      `Name=tag-key,Values=${TESTBED_DEFAULTS.tag}`,
      "Name=instance-state-name,Values=running",
      "--query",
      `Reservations[].Instances[].{id:InstanceId,ip:PublicIpAddress,group:Tags[?Key==\`${TESTBED_DEFAULTS.tag}\`]|[0].Value,launch:LaunchTime}`,
      "--output",
      "json",
    ]);
    return out.code === 0 ? parseTestbedBoxes(out.stdout) : [];
  };

  // The SSH allowlist is this Mac's public IP; when it changes, swap the rule (once per run, one region).
  const allowMe = async (): Promise<void> => {
    if (allowlisted) return;
    allowlisted = true;
    const ip = await deps.publicIp();
    if (ip === undefined) return;
    const me = `${ip}/32`;
    const current = await aws([
      "ec2",
      "describe-security-groups",
      "--group-names",
      TESTBED_DEFAULTS.securityGroup,
      "--query",
      "SecurityGroups[0].IpPermissions[?FromPort==`22`].IpRanges[].CidrIp",
      "--output",
      "text",
    ]);
    const ranges = current.stdout.split(/\s+/).filter(Boolean);
    if (ranges.includes(me)) return;
    const rule = (verb: string, cidr: string): Promise<ToolOutput> =>
      aws([
        `${verb}-security-group-ingress`,
        "--group-name",
        TESTBED_DEFAULTS.securityGroup,
        "--protocol",
        "tcp",
        "--port",
        "22",
        "--cidr",
        cidr,
      ]);
    await rule("authorize", me);
    for (const range of ranges) await rule("revoke", range);
    say(`SSH allowlist now ${me}`);
  };

  const sshArgs = [
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    "ConnectTimeout=15",
    "-i",
    settings.key,
  ];
  const target = (box: TestbedBox): string => `${settings.user}@${box.ip}`;
  const remote = async (box: TestbedBox, command: string): Promise<ToolOutput> => {
    await allowMe();
    return (await deps.exec("ssh", [...sshArgs, target(box), command])) ?? NOT_STARTED;
  };
  const remoteStream = async (box: TestbedBox, command?: string): Promise<number> => {
    await allowMe();
    return deps.stream("ssh", [
      ...sshArgs,
      target(box),
      ...(command === undefined ? [] : [command]),
    ]);
  };

  const pickBox = async (): Promise<TestbedBox | undefined> => {
    const boxes = await listBoxes();
    const flag = request.box;
    const box =
      flag === undefined
        ? boxes[0]
        : /^\d+$/.test(flag)
          ? boxes[Number(flag) - 1]
          : boxes.find((candidate) => candidate.id === flag);
    if (box === undefined) say("no such running testbed box");
    return box;
  };

  const counts = async (slot: string): Promise<GroupCounts | undefined> => {
    const out = await aws([
      "autoscaling",
      "describe-auto-scaling-groups",
      "--auto-scaling-group-names",
      `${TESTBED_DEFAULTS.groupPrefix}${slot}`,
      "--query",
      "AutoScalingGroups[0].[DesiredCapacity,MaxSize,MinSize]",
      "--output",
      "text",
    ]);
    const [desired, max, min] = out.stdout.trim().split(/\s+/).map(Number);
    if (out.code !== 0 || desired === undefined || max === undefined || min === undefined) {
      return undefined;
    }
    if ([desired, max, min].some(Number.isNaN)) return undefined;
    return { desired, max, min };
  };

  const setDesired = (slot: string, desired: number): Promise<ToolOutput> =>
    aws([
      "autoscaling",
      "set-desired-capacity",
      "--auto-scaling-group-name",
      `${TESTBED_DEFAULTS.groupPrefix}${slot}`,
      "--desired-capacity",
      String(desired),
    ]);

  // The fallback runs a preset on GitHub; the workflow takes the preset and the ref, never a command.
  const dispatch = async (preset: string): Promise<number> => {
    const code = await deps.stream("gh", [
      "workflow",
      "run",
      TESTBED_DEFAULTS.fallbackWorkflow,
      "--ref",
      request.ref ?? "",
      "-f",
      `preset=${preset}`,
    ]);
    if (code === 0)
      say(`no healthy box: dispatched ${TESTBED_DEFAULTS.fallbackWorkflow} (${preset})`);
    return code;
  };

  // Wait for a box whose slot is free (never pile onto box 1). The Mac-side claim stops parallel callers
  // picking the same free slot while the first one is still syncing.
  const acquire = async (
    slot: string,
    skip: Set<string>,
  ): Promise<{ box: TestbedBox; number: number } | { exit: number }> => {
    let said = false;
    let busySince: number | undefined;
    for (;;) {
      const boxes = await listBoxes();
      for (const box of orderTestbedBoxes(boxes, slot, skip)) {
        const name = `${box.id}-${slot}`;
        if (!claimTestbedSlot(deps.claimRoot, name, deps.pid, deps.isAlive)) continue;
        const out = await remote(box, `testbed-agent slot ${slot}`);
        if (out.stdout.trim() === "free") return { box, number: boxes.indexOf(box) + 1 };
        releaseTestbedClaim(deps.claimRoot, name);
      }
      let healthy = 0;
      for (const box of orderTestbedBoxes(boxes, slot, new Set())) {
        if ((await remote(box, "testbed-agent health")).code === 0) healthy += 1;
      }
      const preset = request.preset;
      if (
        preset !== undefined &&
        decideTestbedFallback({ healthyCount: healthy, preset }) === "dispatch"
      ) {
        return { exit: await dispatch(preset) };
      }
      if (healthy === 0) {
        if (request.noWait) {
          say("no healthy testbed box");
          return { exit: TESTBED_EXIT.unhealthy };
        }
        if (!said) say("no healthy testbed box, waiting");
      } else {
        if (!said) say("every box busy, waiting");
        busySince ??= deps.now();
        const group = await counts(slot);
        if (
          group !== undefined &&
          shouldScaleTestbed({ busySince, now: deps.now(), desired: group.desired, max: group.max })
        ) {
          await setDesired(slot, group.desired + 1);
          busySince = deps.now();
          say(`every ${slot} slot busy: raised the ${slot} group to ${group.desired + 1}`);
        }
      }
      said = true;
      skip.clear();
      await deps.sleep(TESTBED_POLL_MS);
    }
  };

  // `job prepare`, then rsync into the path it returns.
  const prepareAndSync = async (
    box: TestbedBox,
    id: string,
    project: string,
    directory: string,
  ): Promise<{ code: number; path?: string }> => {
    const prepared = await remote(box, `testbed-agent job prepare ${quote(id)} ${quote(project)}`);
    const path = prepared.stdout.trim().split("\n").pop() ?? "";
    if (prepared.code !== 0 || path === "") return { code: prepared.code || 1 };
    const code = await deps.stream("rsync", [
      "-az",
      "--delete",
      "-e",
      `ssh -o StrictHostKeyChecking=accept-new -i ${settings.key}`,
      ...TESTBED_RSYNC_EXCLUDES.flatMap((pattern) => ["--exclude", pattern]),
      `${directory}/`,
      `${target(box)}:${path}/`,
    ]);
    return { code, path };
  };

  const jobId = (attempt: number): string =>
    `j${deps.now().toString(36)}${deps.pid.toString(36)}${attempt}`;

  const run = async (): Promise<number> => {
    const [who, dir, command] = request.args;
    if (
      who === undefined ||
      dir === undefined ||
      command === undefined ||
      request.args.length > 3
    ) {
      throw new CliUsageError('run takes "<session> <what>", a directory and one command string');
    }
    if (request.preset !== undefined) {
      if (!TESTBED_PRESETS.includes(request.preset)) {
        throw new CliUsageError(`unknown preset: ${request.preset} (${TESTBED_PRESETS.join("|")})`);
      }
      if (request.ref === undefined) throw new CliUsageError("--preset needs --ref <ref>");
    }
    // ci-box and this command exist only on the Mac: a nested call waits forever on the box holding its lock.
    if (refusesTestbedCommand(command)) {
      say("the command must not call ci-box or stackra testbed; run it from the Mac instead");
      return 2;
    }
    const slot = classifyTestbedCommand(command);
    const directory = resolve(request.cwd, dir);
    const project = basename(directory);
    const skip = new Set<string>();
    let retried = false;
    for (let attempt = 1; ; attempt += 1) {
      const got = await acquire(slot, skip);
      if ("exit" in got) return got.exit;
      const { box } = got;
      try {
        say(`box ${got.number}${slot === "light" ? " (light slot)" : ""}`);
        const id = jobId(attempt);
        const synced = await prepareAndSync(box, id, project, directory);
        if (synced.code === TESTBED_EXIT.unhealthy) {
          skip.add(box.id);
          continue;
        }
        if (synced.code !== 0) return synced.code;
        const code = await remoteStream(
          box,
          `testbed-agent job run ${quote(id)} ${slot} ${quote(who)} ${quote(project)} -- ${quote(command)}`,
        );
        if (code === TESTBED_EXIT.unhealthy) {
          skip.add(box.id);
          continue;
        }
        if (code === TESTBED_EXIT.busy) {
          await deps.sleep(1000);
          continue;
        }
        // A spot reclaim drops ssh (255): a light job is safe to run again once on another box, a heavy one never is.
        if (code === 255 && slot === "light" && !retried) {
          retried = true;
          skip.add(box.id);
          say("lost the box (spot reclaim?); retrying once on another box");
          continue;
        }
        return code;
      } finally {
        releaseTestbedClaim(deps.claimRoot, `${box.id}-${slot}`);
      }
    }
  };

  switch (request.verb) {
    case "run": {
      return run();
    }
    case "status": {
      const boxes = await listBoxes();
      if (boxes.length === 0) io.out("no running testbed box\n");
      for (const [index, box] of boxes.entries()) {
        const out = await remote(box, "testbed-agent status");
        io.out(
          `box ${index + 1} ${box.id} ${box.group}: ${out.code === 0 ? out.stdout.trim() : "unreachable"}\n`,
        );
      }
      return 0;
    }
    case "unlock": {
      const box = await pickBox();
      if (box === undefined) return 1;
      return remoteStream(box, `testbed-agent job stop ${request.slot ?? "heavy"}`);
    }
    case "ip": {
      const box = await pickBox();
      if (box === undefined) return 1;
      io.out(`${box.ip}\n`);
      return 0;
    }
    case "ssh": {
      const box = await pickBox();
      if (box === undefined) return 1;
      return remoteStream(box, request.args.length > 0 ? request.args.join(" ") : undefined);
    }
    case "sync": {
      const [dir, ...extra] = request.args;
      if (dir === undefined || extra.length > 0)
        throw new CliUsageError("sync takes one directory");
      const box = await pickBox();
      if (box === undefined) return 1;
      const directory = resolve(request.cwd, dir);
      const project = basename(directory);
      const synced = await prepareAndSync(
        box,
        `sync-${project.replaceAll(/[^A-Za-z0-9_.-]/g, "-")}`,
        project,
        directory,
      );
      if (synced.code === 0) io.out(`${synced.path}\n`);
      return synced.code;
    }
    case "scale": {
      const slots = request.slot === undefined ? ["heavy", "light"] : [request.slot];
      let code = 0;
      for (const slot of slots) {
        const group = await counts(slot);
        if (group === undefined) {
          say(`cannot read the ${slot} group`);
          code = 1;
          continue;
        }
        if (request.slot !== undefined) {
          if (group.desired >= group.max) {
            say(`the ${slot} group is at its maximum (${group.max})`);
            return 1;
          }
          const raised = await setDesired(slot, group.desired + 1);
          if (raised.code !== 0) return raised.code;
          io.out(`${slot}: desired ${group.desired + 1} (min ${group.min}, max ${group.max})\n`);
          continue;
        }
        io.out(`${slot}: desired ${group.desired} (min ${group.min}, max ${group.max})\n`);
      }
      return code;
    }
    case "image": {
      const out = await aws([
        "ssm",
        "get-parameter",
        "--name",
        TESTBED_DEFAULTS.imageParameter,
        "--query",
        "Parameter.[Value,LastModifiedDate]",
        "--output",
        "text",
      ]);
      const [image, modified] = out.stdout.trim().split(/\s+/);
      if (out.code !== 0 || image === undefined) {
        say(`cannot read ${TESTBED_DEFAULTS.imageParameter}`);
        return 1;
      }
      const at =
        modified === undefined
          ? Number.NaN
          : /^[\d.]+$/.test(modified)
            ? Number(modified) * 1000
            : Date.parse(modified);
      io.out(
        `${image} ${Number.isNaN(at) ? "age unknown" : `${Math.floor((deps.now() - at) / 86_400_000)}d`}\n`,
      );
      return 0;
    }
    default: {
      throw new CliUsageError(`unknown verb: ${request.verb}`);
    }
  }
}
