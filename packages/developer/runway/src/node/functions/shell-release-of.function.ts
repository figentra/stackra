/**
 * Stackra file contract:
 * Purpose: `shellReleaseOf(checkout, origin)`, the edge release of a checked-out web shell line: reads its built
 *          `dist/shell.json`, checks it is the line's surface and major at the checked-out version, and answers the
 *          `EdgeShellRelease` (`publishShell`'s `next`) with the entry and every import map module as URLs on the
 *          asset store, under `<origin>/shells/<surface>/<major>/<version>/`.
 * Boundary: reads one file. Uploading the shell's `dist/` there is the OS deploy's; the import map it answers is the
 *           one product bundles build against (`bundleConfig`) and the compatibility gate reads.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); ADR 0437 (`shell:<surface>:<line>`); ADR 0481; app-shells 4.1.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import type { RunwayIssue } from "#core/types/runway-issue.type";
import { LINE_CHECKOUT_SETTINGS } from "#node/constants/line-checkout-settings.constant";
import { SHELL_MANIFEST_SCHEMA } from "#node/constants/shell-manifest-schema.constant";
import type { EdgeShellRelease } from "#node/types/edge-shell-release.type";
import type { LineCheckout } from "#node/types/line-checkout.type";

/**
 * The release of a checked-out shell.
 *
 * @throws RunwayInvalidError when `dist/shell.json` is missing, malformed, or names another surface, major or version.
 * @example
 * const shell = await checkoutLine({ line: "os/console@3", scope: "@figentra", into: ".stackra/shells/console" });
 * await publishShell({ kv, surface: shell.name, line: shell.major, current, next: shellReleaseOf(shell, origin), canaryScopes });
 */
export function shellReleaseOf(checkout: LineCheckout, origin: string): EdgeShellRelease {
  const file = join(checkout.dir, LINE_CHECKOUT_SETTINGS.shellManifest);
  let json: unknown;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new RunwayInvalidError(file, [
      {
        path: "",
        message: `Not readable as JSON (build the shell first): ${(error as Error).message}`,
      },
    ]);
  }
  const parsed = SHELL_MANIFEST_SCHEMA.safeParse(json);
  if (!parsed.success)
    throw new RunwayInvalidError(
      file,
      parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  const manifest = parsed.data;
  const issues: RunwayIssue[] = [];
  if (manifest.surface !== checkout.name)
    issues.push({
      path: "surface",
      message: `Expected ${checkout.name}, found ${manifest.surface}`,
    });
  if (manifest.line !== checkout.major)
    issues.push({ path: "line", message: `Expected ${checkout.major}, found ${manifest.line}` });
  if (manifest.version !== checkout.version)
    issues.push({
      path: "version",
      message: `Expected ${checkout.version}, found ${manifest.version}`,
    });
  if (issues.length > 0) throw new RunwayInvalidError(file, issues);

  const base = `${origin.replace(/\/+$/, "")}/${LINE_CHECKOUT_SETTINGS.shellPath}/${manifest.surface}/${manifest.line}/${manifest.version}/`;
  return {
    version: manifest.version,
    entry: `${base}${manifest.entry}`,
    importMap: {
      imports: Object.fromEntries(
        Object.entries(manifest.importMap.imports).map(([specifier, path]) => [
          specifier,
          `${base}${path}`,
        ]),
      ),
    },
  };
}
