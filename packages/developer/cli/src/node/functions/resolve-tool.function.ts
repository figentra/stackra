/**
 * Stackra file contract:
 * Purpose: `resolveTool(task, member, options)`, the one tool process a member command starts, chosen by the
 *          member's layout and target: Vite for a web or PWA target, Expo for iOS and Android, tsdown for a package,
 *          Wrangler for a worker, the generated Encore app for a service, for the docs app React Router when gen
 *          assembled a Fumadocs site (`react-router dev`, and `react-router build` for `build` and for `lint`, whose
 *          link check reads the build, STA-2026) and Mintlify otherwise (`dev`, `validate` and `broken-links`, in the
 *          `.stackra/site/` gen assembles, or in `src/` for a docs app not yet moved to that layout, STA-1316),
 *          and vitest, tsc
 *          and oxlint everywhere (`--tier int` runs the `.stackra/vitest.int.config.ts` gen writes for a member with an
 *          `.int.test.ts`). Each tool reads the config gen wrote into `.stackra/` when there is one, otherwise the
 *          member-root config it finds itself.
 * Boundary: pure apart from checking which generated configs exist, whether a Fumadocs site's dependencies are
 *           installed, and reading a docs app's dev port from its `runway.yaml` (`environments.dev.port`, the one place
 *           a port is written); starts nothing. A combination with no tool is refused with the reason, never guessed,
 *           and a Fumadocs site with no installed dependencies with the one command to run first (STA-2026, FR-008).
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 2 and 5: targets pick the outputs; tool configs live in `.stackra/`); ADR
 *                     0091 and 0124 (Encore is generated into `stackra-encore`); ADR 0182 (test tiers); ADR 0284
 *                     (workers on Wrangler).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { DOCS_CONFIG_FILE, DOCS_SITE_DIR, ENCORE_SERVICES_DIR } from "@stackra/gen";
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
const TIERS = new Set(["unit", "int", "e2e"]);

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
    const port = (): readonly string[] => {
      const runway = join(root, "runway.yaml");
      const { environments } = existsSync(runway)
        ? ((parse(readFileSync(runway, "utf8")) ?? {}) as {
            environments?: { dev?: { port?: unknown } };
          })
        : {};
      const value = environments?.dev?.port;
      return typeof value === "number" ? ["--port", String(value)] : [];
    };
    if (existsSync(join(site, "react-router.config.ts"))) {
      // The Fumadocs site imports its packages from the member's dependencies (STA-2026).
      if (!existsSync(join(root, "node_modules", "@react-router", "dev")))
        return refuse("the docs site's dependencies are not installed: run `pnpm install` first");
      if (task === "dev") return at("react-router", ["dev", ...port()], site);
      if (task === "build" || task === "lint") return at("react-router", ["build"], site);
      return refuse(
        "the docs app runs React Router, which serves `dev`, `build` and `lint` (the link check reads the build)",
      );
    }
    if (task === "dev") return at("mint", ["dev", ...port()], site);
    if (task === "build") return at("mint", ["validate"], site);
    if (task === "lint") return at("mint", ["broken-links"], site);
    return refuse("the docs app runs Mintlify, which serves `dev`, `build` and `lint`");
  }

  switch (task) {
    case "lint": {
      return at("oxlint", ["."]);
    }
    case "typecheck": {
      return at("tsc", ["--noEmit"]);
    }
    case "test": {
      const tier = options.tier ?? "unit";
      if (!TIERS.has(tier))
        throw new CliUsageError(`unknown tier: ${tier} (expected unit, int or e2e)`);
      if (tier === "unit") return at("vitest", ["run", ...config("vitest.config.ts")]);
      if (tier === "int") {
        // Gen writes this config for a package or service that has an `.int.test.ts`; nobody authors one.
        if (layout !== "package" && layout !== "service")
          return refuse("integration tests run in a package or a service");
        return existsSync(join(root, ".stackra", "vitest.int.config.ts"))
          ? at("vitest", ["run", ...config("vitest.int.config.ts")])
          : refuse(
              "gen wrote no .stackra/vitest.int.config.ts, so the member has no `.int.test.ts`",
            );
      }
      if (layout === "package") {
        // Gen writes this config for a package that has a `<name>.e2e.page.tsx`; nobody authors one.
        return existsSync(join(root, ".stackra", "playwright.e2e.config.ts"))
          ? at("playwright", ["test", ...config("playwright.e2e.config.ts")])
          : refuse(
              "gen wrote no .stackra/playwright.e2e.config.ts: add a src/**/__tests__/<name>.e2e.page.tsx",
            );
      }
      if (layout !== "app") return refuse("e2e tests run in an app or a package");
      if (native) return at("maestro", ["test", ".stackra/maestro"]);
      if (web || targets.includes("desktop")) {
        return at("playwright", ["test", ...config("playwright.config.ts")]);
      }
      return refuse("the app declares no targets");
    }
    case "dev": {
      if (layout === "worker") return at("wrangler", ["dev", ...config("wrangler.jsonc")]);
      if (layout === "service") {
        // `encore run` in the member root, where encore.app is; it discovers the services gen wrote beside it.
        if (!existsSync(join(root, ENCORE_SERVICES_DIR)))
          return refuse(`gen has not written the Encore services (${ENCORE_SERVICES_DIR})`);
        return at("encore", ["run"]);
      }
      if (layout !== "app") return refuse(`a ${layout} has nothing to serve`);
      if (web) return at("vite", [...config("vite.config.ts")]);
      if (native) return at("expo", ["start", ...platform]);
      return refuse(
        target === "desktop"
          ? "the desktop target has no dev tool yet"
          : "the app declares no targets",
      );
    }
    case "build": {
      // From the member root, with no --config: tsdown would take `.stackra/` as its cwd, where the generated
      // `.stackra/entry/*` paths do not resolve. The root config is gen's shim or an authored one importing it.
      if (layout === "package") return at("tsdown", []);
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
    }
    case "start": {
      if (layout === "app" && web) return at("vite", ["preview", ...config("vite.config.ts")]);
      return refuse("`start` previews an app's web build");
    }
  }
}
