// Stackra guard plugin (OpenCode v2 plugin API: https://opencode.ai/v2/docs/build/plugins).
// Denies secret reads/writes and owner-only commands, and refuses edits in the main checkout (worktree-only).
// The rules live in decide.ts (unit-tested: node --test .opencode/plugins/guard/__tests__/decide.test.ts).
// Plain { id, setup } export: V2 reads the default export's id and setup(), so no @opencode/plugin install.
import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { resolve } from "node:path";
import { decideEdit, decidePath, decideShell, type GuardContext } from "./decide.ts";

/** Main checkout = `git rev-parse --git-dir` equals `--git-common-dir`; a linked worktree's git-dir differs. */
function inMainCheckout(cwd: string): boolean {
  const r = spawnSync("git", ["rev-parse", "--git-dir", "--git-common-dir"], {
    cwd,
    encoding: "utf8",
  });
  if (r.status !== 0) return false; // not a git repo: nothing to protect
  const [dir, common] = r.stdout
    .trim()
    .split("\n")
    .map((p) => realpathSync(resolve(cwd, p)));
  return dir === common;
}

/** The worktree root containing cwd (falls back to cwd outside git). */
function worktreeRoot(cwd: string): string {
  const r = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd, encoding: "utf8" });
  return realpathSync(r.status === 0 ? r.stdout.trim() : cwd);
}

const ctxFor = (cwd: string): GuardContext => ({
  root: worktreeRoot(cwd),
  inMainCheckout: inMainCheckout(cwd),
  allowMain: process.env.STACKRA_ALLOW_MAIN === "1",
});

// Minimal shapes of the hook events we use (PermissionEvaluation, ShellCreateBefore in the docs).
interface PermissionEvaluation {
  action: string;
  resources: readonly string[];
  effect: "allow" | "ask" | "deny";
  message?: string;
}
interface ShellCreateBefore {
  command: string;
  cwd: string;
}
interface Ctx {
  location: { directory: string };
  permission: {
    hook(name: "evaluate", cb: (e: PermissionEvaluation) => void | Promise<void>): Promise<unknown>;
  };
  shell: {
    hook(
      name: "create.before",
      cb: (e: ShellCreateBefore) => void | Promise<void>,
    ): Promise<unknown>;
  };
}

export default {
  id: "stackra.guard",
  async setup(ctx: Ctx) {
    const root = ctx.location.directory;

    // 1. Permission layer: deny before a prompt or an auto-approve (--auto) can let it through.
    await ctx.permission.hook("evaluate", (e) => {
      for (const r of e.resources) {
        const d =
          e.action === "shell"
            ? decideShell(r, root)
            : e.action === "edit"
              ? decideEdit(r, ctxFor(root))
              : e.action === "read"
                ? decidePath(r)
                : { kind: "allow" as const };
        if (d.kind === "deny") {
          e.effect = "deny";
          e.message = d.reason;
          return;
        }
      }
    });

    // 2. Execution layer: deny again (belt and braces) with the real cwd's command.
    await ctx.shell.hook("create.before", (e) => {
      const d = decideShell(e.command, e.cwd);
      if (d.kind === "deny") e.command = `echo ${JSON.stringify(d.reason)} >&2; exit 126`;
    });
  },
};
