#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `brand-pull`, the stand-in for `figentra-brand pull` (brand rules §32): copies an app's brand files from the
 *   local figentra/brand checkout at the sha its `brand.json` pins into a gitignored folder. Run from the app folder
 *   (`node ../../tools/scripts/brand-pull.mjs`, wired as the app's `brand:pull` and pre-scripts). Each `files` row is
 *   one of: `{ to, from }` (copy `brands/<brand>/<from>`), `{ to, from, size }` (an SVG rasterised to a square PNG with
 *   macOS `sips`, as ci-box's PNG exports are not published yet) or `{ to, json }` (a small config file, such as an
 *   Icon Composer `icon.json`). A stamp of the sha skips a pull that already happened.
 * Boundary: reads the brand repo through `git show <sha>:<path>` only (its working tree and HEAD are never used or
 *   written); writes only under the app's `out` folder. A missing repo or sha fails loudly with the fix.
 * Runtime: node
 * Governing contract: figentra/brand rules §32 (apps pin a brand sha; brand files are build output, never committed);
 *   STA-1371 (stackra-214).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Where the brand repo is looked for: `FIGENTRA_BRAND_REPO`, else the owner's checkout. */
const DEFAULT_REPO = join(homedir(), "Projects/figentra/brand");

/**
 * Pulls the files `pin` lists into `out` (relative to `appDir`).
 * @param {{ appDir: string, repo?: string, force?: boolean }} options
 * @returns {{ pulled: number, skipped: boolean }}
 */
export function brandPull({
  appDir,
  repo = process.env.FIGENTRA_BRAND_REPO ?? DEFAULT_REPO,
  force = false,
}) {
  const pin = JSON.parse(readFileSync(join(appDir, "brand.json"), "utf8"));
  if (pin.source !== "local") {
    throw new Error(
      `brand-pull: source "${pin.source}" is not supported yet; the registry pull is not live (§32).`,
    );
  }
  const out = resolve(appDir, pin.out);
  const stamp = join(out, ".sha");
  if (!force && existsSync(stamp) && readFileSync(stamp, "utf8").trim() === pin.sha) {
    return { pulled: 0, skipped: true };
  }
  const fix = `Clone figentra/brand to ${DEFAULT_REPO} (or set FIGENTRA_BRAND_REPO) and fetch so ${pin.sha} exists, then rerun \`pnpm brand:pull\`.`;
  if (!existsSync(join(repo, ".git")))
    throw new Error(`brand-pull: no figentra/brand checkout at ${repo}. ${fix}`);
  const git = (args, encoding) =>
    execFileSync("git", ["-C", repo, ...args], { encoding, maxBuffer: 64 << 20 });
  try {
    git(["cat-file", "-e", `${pin.sha}^{commit}`]);
  } catch {
    throw new Error(`brand-pull: ${repo} has no commit ${pin.sha}. ${fix}`);
  }
  rmSync(out, { recursive: true, force: true });
  for (const row of pin.files) {
    const target = join(out, row.to);
    mkdirSync(dirname(target), { recursive: true });
    if (row.json !== undefined) {
      writeFileSync(target, `${JSON.stringify(row.json, null, 2)}\n`);
      continue;
    }
    const bytes = git(["show", `${pin.sha}:brands/${pin.brand}/${row.from}`]);
    if (row.size === undefined) {
      writeFileSync(target, bytes);
      continue;
    }
    // shortcut: sips is macOS only; replace with the registry's PNG exports once `figentra-brand pull` is live.
    if (process.platform !== "darwin") {
      throw new Error(
        `brand-pull: rasterising ${row.from} needs macOS sips; pull on a Mac until the registry ships PNGs.`,
      );
    }
    const svg = join(tmpdir(), `brand-pull-${process.pid}.svg`);
    writeFileSync(svg, bytes);
    execFileSync(
      "sips",
      ["-s", "format", "png", "-z", String(row.size), String(row.size), svg, "--out", target],
      {
        stdio: "ignore",
      },
    );
    rmSync(svg);
  }
  writeFileSync(stamp, `${pin.sha}\n`);
  return { pulled: pin.files.length, skipped: false };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { pulled, skipped } = brandPull({
      appDir: process.cwd(),
      force: process.argv.includes("--force"),
    });
    console.log(skipped ? "brand-pull: up to date" : `brand-pull: ${pulled} files`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
