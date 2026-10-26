/**
 * Stackra file contract:
 * Purpose: `GEN_COMMAND`, `stackra gen [--check] [--manifests] [--backend tsgo|ts6]`: gen-core over the member in the
 *          working directory, or at the workspace root over every member with a `stackra.config.ts`, in two passes.
 *          Pass 1 writes every member's `stackra.manifest.json` (a manifest never waits for a client, so services that
 *          consume each other's clients in a cycle all get one); pass 2 generates the clients and the rest against
 *          those manifests, in rounds (the refused members and the client consumers) until a round writes nothing. `--manifests`
 *          runs pass 1 alone (the bootstrap). `--check` writes nothing and fails on a refusal or a stale file, which
 *          is the CI gate.
 * Boundary: runs every member even after one fails, so one run reports everything; only the last round's refusals
 *           print; exits 1 when any member is not clean.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: `stackra gen --check`); ADR 0295 (decisions 1 and 5); ADR 0261;
 *                     ADR 0260 (a cycle between services is allowed at the manifest level).
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { runGen } from "#node/functions/run-gen.function";
import { workspaceMembers } from "#node/functions/workspace-members.function";
import type { CliCommand } from "#node/types/cli-command.type";

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
  async run({ cwd, values, io }) {
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
    const roots = existsSync(join(cwd, "pnpm-workspace.yaml"))
      ? workspaceMembers(cwd).filter((root) => existsSync(join(root, "stackra.config.ts")))
      : [cwd];

    // Pass 1: every manifest. Alone (--manifests) it reports its refusals; otherwise pass 2 reports them.
    if (options.check !== true) {
      const passIo = manifests ? io : { ...io, err: () => {} };
      let written = true;
      for (const root of roots)
        written = (await runGen(root, { ...options, pass: "manifests" }, passIo)) && written;
      if (manifests) return written ? 0 : 1;
    }

    // Pass 2 runs in rounds until one writes nothing (gen is deterministic, so a quiet round is the fixed point). A
    // refused member may still write its clients or manifest, and a manifest written late can change the clients of
    // a member already clean, so the next round reruns the members refused and those that consume another service.
    let pending = roots;
    for (let round = 1; ; round += 1) {
      const failed: { readonly root: string; readonly lines: string[] }[] = [];
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
        if (!(await runGen(root, options, { ...roundIo, err: (text) => lines.push(text) })))
          failed.push({ root, lines });
      }
      const refused = new Set(failed.map(({ root }) => root));
      const next = roots.filter(
        (root) => refused.has(root) || existsSync(join(root, ".stackra", "gen", "clients")),
      );
      if (options.check === true || !wrote || next.length === 0 || round > roots.length) {
        for (const { lines } of failed) for (const line of lines) io.err(line);
        if (options.check === true && failed.length === 0)
          io.out(`gen --check: ${roots.length} member(s) up to date\n`);
        return failed.length === 0 ? 0 : 1;
      }
      pending = next;
    }
  },
};
