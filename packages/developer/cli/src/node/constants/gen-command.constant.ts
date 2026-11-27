/**
 * Stackra file contract:
 * Purpose: `GEN_COMMAND`, `stackra gen [--check] [--manifests] [--backend tsgo|ts6]`: gen-core over the member in the
 *          working directory, or at the workspace root over every member with a `stackra.config.ts`, in two passes.
 *          Pass 1 writes every member's `stackra.manifest.json` (a manifest never waits for a client, so services that
 *          consume each other's clients in a cycle all get one); pass 2 generates the clients and the rest against
 *          those manifests, in rounds (the refused members and the client consumers) until a round writes nothing. `--manifests`
 *          runs pass 1 alone (the bootstrap). `--check` writes nothing and fails on a refusal or a stale file, which
 *          is the CI gate. At a workspace root with a root runway it also writes Claude's `.claude/launch.json`
 *          and VS Code's `dev: …` tasks from the runways (`writeLaunchFiles`); `--check` fails when one is stale.
 *          Under `--json` (`context.report`) the data is each member's outcome (clean, written, stale), every refusal
 *          and warning with its member, code, file (from the working directory), line, column, subject, message and
 *          fix, the members skipped and the launch files.
 * Boundary: runs every member even after one fails, so one run reports everything; only the last round's refusals
 *           print, with every member's warnings (a member that passes too) and an `N warning(s) in M member(s)` line;
 *           exits 1 when any member is not clean, and a warning never changes the exit code. At a workspace root a
 *           member with no `node_modules` (left out by a filtered install) is skipped by name, never refused.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: `stackra gen --check`); ADR 0295 (decisions 1 and 5); ADR 0261;
 *                     ADR 0260 (a cycle between services is allowed at the manifest level);
 *                     STA-2081 (the launch file); STA-2883 (`--json`).
 */
import { existsSync } from "node:fs";
import { join, relative } from "node:path";

import type { GenError } from "@stackra/gen";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { writeLaunchFiles } from "#node/launch-config/functions/write-launch-files.function";
import { runGen } from "#node/functions/run-gen.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { GenOutcome } from "#node/types/gen-outcome.type";

/** A finding as `--json` reports it: its member, and its file from the working directory. */
const finding = (member: string, error: GenError) => ({
  member,
  code: error.code,
  file: member === "." ? error.file : `${member}/${error.file}`,
  line: error.line,
  column: error.column,
  subject: error.subject,
  message: error.message,
  fix: error.fix,
});

/** The `--json` data of a run: each member's latest outcome, the findings, the skipped members and the launch files. */
const genData = (
  check: boolean,
  outcomes: Iterable<GenOutcome>,
  skipped: readonly string[],
  launch: readonly { readonly file: string; readonly status: string }[],
) => {
  const all = [...outcomes];
  return {
    check,
    clean:
      all.every((outcome) => outcome.clean) && !launch.some(({ status }) => status === "stale"),
    members: all.map(({ member, clean, written, stale }) => ({ member, clean, written, stale })),
    refusals: all.flatMap(({ member, errors }) => errors.map((error) => finding(member, error))),
    warnings: all.flatMap(({ member, warnings }) =>
      warnings.map((error) => finding(member, error)),
    ),
    skipped,
    launch,
  };
};

/** The `stackra gen` command definition. */
export const GEN_COMMAND: CliCommand = {
  name: "gen",
  summary:
    "Generate the manifest, schemas, wiring and entries (--check: fail when stale; --manifests: manifests only)",
  usage: "stackra gen [--check] [--manifests] [--backend tsgo|ts6]",
  options: {
    check: { type: "boolean" },
    backend: { type: "string" },
    manifests: { type: "boolean" },
  },
  async run({ cwd, values, io, report: reportData }) {
    const backend = values["backend"];
    if (backend !== undefined && backend !== "tsgo" && backend !== "ts6") {
      throw new CliUsageError(`unknown backend: ${String(backend)} (expected tsgo or ts6)`);
    }
    const manifests = values["manifests"] === true;
    if (manifests && values["check"] === true)
      throw new CliUsageError("--manifests writes the manifests; run --check on its own");
    const options: Parameters<typeof runGen>[1] = {
      check: values["check"] === true,
      base: cwd,
      ...(backend === "tsgo" || backend === "ts6" ? { backend } : {}),
    };
    const workspace = existsSync(join(cwd, "pnpm-workspace.yaml"));
    const configured = workspace
      ? workspaceMembers(cwd).filter((root) => existsSync(join(root, "stackra.config.ts")))
      : [cwd];
    // A member a filtered install left out (CI's `--filter='!@figentra/playground'`) cannot resolve its @stackra
    // bases, so every class reads as unregistered; skip it by name instead of refusing it.
    const roots = workspace
      ? configured.filter((folder) => existsSync(join(folder, "node_modules")))
      : configured;
    const skipped = configured
      .filter((root) => !roots.includes(root))
      .map((root) => relative(cwd, root));
    for (const folder of skipped) io.out(`gen: skipped ${folder}: not installed\n`);
    // Each member's latest outcome, for `--json`.
    const outcomes = new Map<string, GenOutcome>();
    const keep = (root: string) => (outcome: GenOutcome) => {
      outcomes.set(root, outcome);
    };

    // The dev-server lists (Claude, VS Code) read only the runways, so they are settled before the members (STA-2081).
    const launch =
      workspace && !manifests && existsSync(join(cwd, "runway.yaml"))
        ? writeLaunchFiles(cwd, options.check === true)
        : [];
    for (const { file, status } of launch) {
      if (status === "written") io.out(`gen: wrote ${file}\n`);
      if (status === "stale")
        io.err(`gen: ${file} is stale; run stackra gen at the workspace root\n`);
    }
    const launchStale = launch.some(({ status }) => status === "stale");

    // Pass 1: every manifest. Alone (--manifests) it reports its refusals; otherwise pass 2 reports them.
    if (options.check !== true) {
      const passIo = manifests ? io : { ...io, err: () => {} };
      let written = true;
      for (const root of roots)
        written =
          (await runGen(root, { ...options, pass: "manifests" }, passIo, keep(root))) && written;
      if (manifests) {
        reportData?.(genData(false, outcomes.values(), skipped, launch));
        return written ? 0 : 1;
      }
    }

    // Pass 2 runs in rounds until one writes nothing (gen is deterministic, so a quiet round is the fixed point). A
    // refused member may still write its clients or manifest, and a manifest written late can change the clients of
    // a member already clean, so the next round reruns the members refused and those that consume another service.
    let pending = roots;
    // Each member's lines from its latest run: a member that passes still prints its warnings (STA-2561).
    const report = new Map<string, readonly string[]>();
    for (let round = 1; ; round += 1) {
      const failed: string[] = [];
      let wrote = false;
      const roundIo = {
        ...io,
        out: (text: string) => {
          wrote = true;
          io.out(text);
        },
      };
      for (const root of pending) {
        const lines: string[] = [];
        if (
          !(await runGen(
            root,
            options,
            { ...roundIo, err: (text) => lines.push(text) },
            keep(root),
          ))
        )
          failed.push(root);
        report.set(root, lines);
      }
      const refused = new Set(failed);
      const next = roots.filter(
        (root) => refused.has(root) || existsSync(join(root, ".stackra", "gen", "clients")),
      );
      if (options.check === true || !wrote || next.length === 0 || round > roots.length) {
        for (const lines of report.values()) for (const line of lines) io.err(line);
        const warned = [...report.values()].map(
          (lines) => lines.filter((line) => line.startsWith("warning: ")).length,
        );
        const warnings = warned.reduce((sum, count) => sum + count, 0);
        if (warnings > 0)
          io.err(
            `gen: ${warnings} warning(s) in ${warned.filter((count) => count > 0).length} member(s)\n`,
          );
        if (options.check === true && failed.length === 0)
          io.out(`gen --check: ${roots.length} member(s) up to date\n`);
        reportData?.(genData(options.check === true, outcomes.values(), skipped, launch));
        return failed.length === 0 && !launchStale ? 0 : 1;
      }
      pending = next;
    }
  },
};
