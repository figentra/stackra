/**
 * Stackra file contract:
 * Purpose: `resolveTool(task, member, options)`, the one tool process a member command starts, chosen by the
 *          member's layout and target: Vite for a web or PWA target, Expo for iOS and Android, tsdown for a package,
 *          Wrangler for a worker, the generated Encore app for a service, Mintlify for the docs app (`dev`,
 *          `validate` and `broken-links`, in the `.stackra/site/` gen assembles, or in `src/` for a docs app not yet
 *          moved to that layout, STA-1316), and vitest, tsc
 *          and oxlint everywhere. Each tool reads the config gen wrote into `.stackra/` when there is one, otherwise the
 *          member-root config it finds itself.
 * Boundary: pure apart from checking which generated configs exist and reading a docs app's dev port from its
 *           `runway.yaml` (`environments.dev.port`, the one place a port is written); starts nothing. A combination with no tool is
 *           refused with the reason, never guessed.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 2 and 5: targets pick the outputs; tool configs live in `.stackra/`); ADR
 *                     0091 and 0124 (Encore is generated into `.stackra/encore`); ADR 0182 (test tiers); ADR 0284
 *                     (workers on Wrangler).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DOCS_CONFIG_FILE, DOCS_SITE_DIR } from "@stackra/gen";
import { parse } from "yaml";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { Member } from "#node/types/member.type";
import type { ToolRun } from "#node/types/tool-run.type";
import type { ToolTask } from "#node/types/tool-task.type";

/** The targets Vite and Playwright serve. */
const WEB_TARGETS = new Set(["web", "pwa"]);

/** The targets Expo and Maestro serve. */
const NATIVE_TARGETS = new Set(["ios", "android"]);

/** The test tiers a member command runs; the other tiers of ADR 0182 run under their own tasks. */
const TIERS = new Set(["unit", "e2e"]);

/**
 * The tool process for `task` in `member`.
 *
 * @param task - the command.
 * @param member - the member it runs in.
 * @param options - `target` picks one of an app's targets; `tier` picks the test tier (default `unit`).
 * @throws CliUsageError when `target` is not one of the app's targets or `tier` is unknown.
 * @throws Error when no tool serves this task for this member, naming why.
 * @example
 * resolveTool("dev", readMember("apps/web"), {});
 * // { command: "vite", args: ["--config", ".stackra/vite.config.ts"], cwd: "/repo/apps/web" }
 */
export function resolveTool(
  task: ToolTask,
  member: Member,
  options: { readonly target?: string | undefined; readonly tier?: string | undefined },
): ToolRun {
  const { root, layout, targets } = member;
  const at = (command: string, args: readonly string[], cwd = root): ToolRun => ({
    command,
    args,
    cwd,
  });
  const config = (file: string): readonly string[] =>
    existsSync(join(root, ".stackra", file)) ? ["--config", `.stackra/${file}`] : [];
  const refuse = (why: string): never => {
    throw new Error(`stackra ${task} has no tool for ${root}: ${why}`);
  };

  const target = options.target;
  if (target !== undefined && !targets.includes(target)) {
    throw new CliUsageError(
      targets.length === 0
        ? `--target needs an app with targets; ${root} has none`
        : `unknown target: ${target} (this app has ${targets.join(", ")})`,
    );
  }
  const web =
    target === undefined ? targets.some((t) => WEB_TARGETS.has(t)) : WEB_TARGETS.has(target);
  const native =
    target === undefined
      ? !web && targets.some((t) => NATIVE_TARGETS.has(t))
      : NATIVE_TARGETS.has(target);
  const platform = target === undefined ? [] : [`--${target}`];

  if (layout === "docs") {
    // The site gen assembles; a docs app not yet swept to the clean layout keeps Mintlify's root in src/.
    const site = existsSync(join(root, DOCS_CONFIG_FILE))
      ? join(root, DOCS_SITE_DIR)
      : join(root, "src");
    if (task === "dev") {
      const runway = join(root, "runway.yaml");
      const { environments } = existsSync(runway)
        ? ((parse(readFileSync(runway, "utf8")) ?? {}) as {
            environments?: { dev?: { port?: unknown } };
          })
        : {};
      const port = environments?.dev?.port;
      return at(
        "mint",
        ["dev", ...(typeof port === "number" ? ["--port", String(port)] : [])],
        site,
      );
    }
    if (task === "build") return at("mint", ["validate"], site);
    if (task === "lint") return at("mint", ["broken-links"], site);
    return refuse("the docs app runs Mintlify, which serves `dev`, `build` and `lint`");
  }

  switch (task) {
    case "lint":
      return at("oxlint", ["."]);
    case "typecheck":
      return at("tsc", ["--noEmit"]);
    case "test": {
      const tier = options.tier ?? "unit";
      if (!TIERS.has(tier)) throw new CliUsageError(`unknown tier: ${tier} (expected unit or e2e)`);
      if (tier === "unit") return at("vitest", ["run", ...config("vitest.config.ts")]);
      if (layout !== "app") return refuse("e2e tests run in an app");
      if (native) return at("maestro", ["test", ".stackra/maestro"]);
      if (web || targets.includes("desktop")) {
        return at("playwright", ["test", ...config("playwright.config.ts")]);
      }
      return refuse("the app declares no targets");
    }
    case "dev":
      if (layout === "worker") return at("wrangler", ["dev", ...config("wrangler.jsonc")]);
      if (layout === "service") {
        const encore = join(root, ".stackra", "encore");
        if (!existsSync(encore))
          return refuse("gen has not written the Encore app (.stackra/encore)");
        return at("encore", ["run"], encore);
      }
      if (layout !== "app") return refuse(`a ${layout} has nothing to serve`);
      if (web) return at("vite", [...config("vite.config.ts")]);
      if (native) return at("expo", ["start", ...platform]);
      return refuse(
        target === "desktop"
          ? "the desktop target has no dev tool yet"
          : "the app declares no targets",
      );
    case "build":
      if (layout === "package") return at("tsdown", [...config("tsdown.config.ts")]);
      if (layout === "worker") {
        return at("wrangler", [
          "deploy",
          "--dry-run",
          "--outdir",
          "dist",
          ...config("wrangler.jsonc"),
        ]);
      }
      if (layout !== "app") return refuse(`no build tool for a ${layout} yet`);
      if (web) return at("vite", ["build", ...config("vite.config.ts")]);
      if (native) return at("expo", ["export", "--platform", target ?? "all"]);
      return refuse(
        target === "desktop"
          ? "the desktop target has no build tool yet"
          : "the app declares no targets",
      );
    case "start":
      if (layout === "app" && web) return at("vite", ["preview", ...config("vite.config.ts")]);
      return refuse("`start` previews an app's web build");
  }
}
