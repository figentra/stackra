/**
 * Stackra file contract:
 * Purpose: `checkoutLine(request)`, the template line step: resolves a line the root runway names
 *          (`<owner>/<name>@<major>`) to its package (`<scope>/<owner>-<name>`) and the highest released version of
 *          that major, fetches it (`npm pack`) and unpacks it into a folder, or copies a local checkout of the line
 *          instead, and optionally makes the folder a git checkout of that release, so the mobile job builds from it
 *          (`templateDir`) and the OS deploy reads a shell's built files and import map from it (`shellReleaseOf`).
 * Boundary: runs `npm`, `tar` and `git` through the command runner and writes only the target folder (and a temporary
 *           folder for the tarball). `dryRun` resolves the version (one `npm view`, a read) and plans the rest without
 *           running or writing anything. The registry is the scope's `.npmrc` mapping in `cwd`; no credential is an
 *           argument. A local checkout must be the line's own package at the line's major. A git checkout excludes
 *           `LINE_CHECKOUT_SETTINGS.localIgnore` (installs, native projects, `.stackra/` secrets) from its commits.
 * Runtime: node
 * Governing contract: ADR 0481 (template lines release as registry packages); ADR 0439 (decision 1); ADR 0436
 *                     (decisions 4 and 6); ADR 0441 (decision 5: Runway names no owner's scope).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";

import { SHELL_LINE_SCHEMA } from "#core/constants/shell-line-schema.constant";
import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import type { DeployStep } from "#core/types/deploy-step.type";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { runCommand } from "#node/functions/run-command.function";
import type { LineCheckout } from "#node/types/line-checkout.type";
import type { LineCheckoutRequest } from "#node/types/line-checkout-request.type";

/** A released version: no pre-release is ever a line's release. */
const RELEASE = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/;

/** Whether release `a` is older than release `b`. */
function older(a: string, b: string): boolean {
  const [, ...left] = RELEASE.exec(a) ?? [];
  const [, ...right] = RELEASE.exec(b) ?? [];
  for (let index = 0; index < 3; index++) {
    const difference = Number(left[index]) - Number(right[index]);
    if (difference !== 0) return difference < 0;
  }
  return false;
}

/** The highest release in `npm view <package>@<major> version --json` output, or `undefined`. */
function highestOf(out: string): string | undefined {
  const text = out.trim();
  if (text === "") return undefined;
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  return (Array.isArray(value) ? value : [value])
    .filter((item): item is string => typeof item === "string" && RELEASE.test(item))
    .reduce<string | undefined>(
      (best, item) => (best === undefined || older(best, item) ? item : best),
      undefined,
    );
}

/** The tarball `npm pack --json` wrote. */
function tarballOf(out: string, packageName: string): string {
  try {
    const value: unknown = JSON.parse(out);
    const filename = (Array.isArray(value) ? value[0] : value) as
      | { filename?: unknown }
      | undefined;
    if (typeof filename?.filename === "string") return filename.filename;
  } catch {
    // reported below
  }
  throw new RunwayUnresolvedError(`npm pack answered no tarball for ${packageName}`);
}

/** The version of the local checkout at `folder`, which must be `packageName` at `major`. */
function localVersion(folder: string, packageName: string, major: string): string {
  let manifest: { name?: unknown; version?: unknown };
  try {
    manifest = JSON.parse(readFileSync(join(folder, "package.json"), "utf8")) as typeof manifest;
  } catch {
    throw new RunwayUnresolvedError(
      `The local line checkout ${folder} has no readable package.json`,
    );
  }
  const version = typeof manifest.version === "string" ? manifest.version : "";
  const issues: RunwayIssue[] = [];
  if (manifest.name !== packageName)
    issues.push({
      path: "local",
      message: `Expected ${packageName}, found ${String(manifest.name)}`,
    });
  if (RELEASE.exec(version)?.[1] !== major)
    issues.push({
      path: "local",
      message: `Expected a ${major}.x.y version, found ${version || "none"}`,
    });
  if (issues.length > 0) throw new RunwayInvalidError(join(folder, "package.json"), issues);
  return version;
}

/**
 * Checks out one template line release.
 *
 * @throws RunwayInvalidError when the line or scope is malformed, the folder is not empty, or the local checkout is
 *         another package or major.
 * @throws RunwayUnresolvedError when the registry has no release on the line's major or the fetch fails.
 * @example
 * const template = await checkoutLine({ line: "os/mobile@3", scope: "@figentra", into: ".stackra/mobile/app", git: true });
 * await runMobileJob({ repository: ".", app: "app", templateDir: template.dir, sha: template.sha!, … });
 */
export async function checkoutLine(request: LineCheckoutRequest): Promise<LineCheckout> {
  const issues: RunwayIssue[] = [];
  if (!SHELL_LINE_SCHEMA.safeParse(request.line).success)
    issues.push({ path: "line", message: "Expected <owner>/<name>@<major>" });
  if (!/^@[a-z0-9][a-z0-9._-]*$/.test(request.scope))
    issues.push({ path: "scope", message: "Expected an npm scope, such as @figentra" });
  if (existsSync(request.into) && readdirSync(request.into).length > 0)
    issues.push({ path: "into", message: `${request.into} is not empty` });
  if (issues.length > 0) throw new RunwayInvalidError("template line", issues);

  const [owner = "", rest = ""] = request.line.split("/");
  const [name = "", major = ""] = rest.split("@");
  const packageName = `${request.scope}/${owner}-${name}`;
  const run = request.run ?? runCommand;
  const steps: DeployStep[] = [];
  const step = async (command: string, args: readonly string[], cwd?: string): Promise<string> => {
    steps.push({ command, args, ...(cwd === undefined ? {} : { cwd }) });
    return request.dryRun === true ? "" : run(command, args, { cwd });
  };

  let version: string;
  let from: LineCheckout["from"];
  if (request.local !== undefined) {
    from = "local";
    version = localVersion(request.local, packageName, major);
    if (request.dryRun !== true) {
      const local = request.local;
      cpSync(local, request.into, {
        recursive: true,
        filter: (path) =>
          !(LINE_CHECKOUT_SETTINGS.localIgnore as readonly string[]).includes(
            relative(local, path).split(sep)[0] ?? "",
          ),
      });
    }
  } else {
    from = "registry";
    const spec = `${packageName}@${major}`;
    let out: string;
    try {
      // A read even in a dry run: the plan names the exact version it would fetch.
      steps.push({ command: "npm", args: ["view", spec, "version", "--json"] });
      out = await run("npm", ["view", spec, "version", "--json"], { cwd: request.cwd });
    } catch (error) {
      throw new RunwayUnresolvedError(
        `Cannot read the releases of ${packageName}: ${(error as Error).message}`,
      );
    }
    const highest = highestOf(out);
    if (highest === undefined)
      throw new RunwayUnresolvedError(
        `${packageName} has no release on line ${major}: publish ${packageName}@${major}.x.y first`,
      );
    version = highest;
    const packDir = request.dryRun === true ? "<tmp>" : mkdtempSync(join(tmpdir(), "runway-line-"));
    try {
      const packed = await step(
        "npm",
        ["pack", `${packageName}@${version}`, "--pack-destination", packDir, "--json"],
        request.cwd,
      );
      const tarball = request.dryRun === true ? "<tarball>" : tarballOf(packed, packageName);
      if (request.dryRun !== true) mkdirSync(request.into, { recursive: true });
      await step("tar", [
        "-xzf",
        join(packDir, tarball),
        "-C",
        request.into,
        `--strip-components=1`,
        LINE_CHECKOUT_SETTINGS.tarballRoot,
      ]);
    } finally {
      if (request.dryRun !== true) rmSync(packDir, { recursive: true, force: true });
    }
  }

  let sha: string | undefined;
  if (request.git === true) {
    const identity = LINE_CHECKOUT_SETTINGS.gitIdentity;
    await step("git", ["init", "--quiet"], request.into);
    // An npm tarball carries no .gitignore: keep installs, native projects and the store workflow's key files
    // (`.stackra/`) out of the commit EAS builds from.
    if (existsSync(join(request.into, ".git"))) {
      mkdirSync(join(request.into, ".git", "info"), { recursive: true });
      writeFileSync(
        join(request.into, ".git", "info", "exclude"),
        `${LINE_CHECKOUT_SETTINGS.localIgnore.map((folder) => `/${folder}/`).join("\n")}\n`,
      );
    }
    await step("git", ["add", "--all"], request.into);
    await step(
      "git",
      [...identity, "commit", "--quiet", "--no-verify", "--message", `${packageName}@${version}`],
      request.into,
    );
    sha = (await step("git", ["rev-parse", "HEAD"], request.into)).trim() || undefined;
  }

  return {
    line: request.line,
    major,
    name,
    package: packageName,
    version,
    from,
    dir: request.into,
    ...(sha === undefined ? {} : { sha }),
    steps,
  };
}
