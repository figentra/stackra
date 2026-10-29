/**
 * Stackra file contract:
 * Purpose: `prepareMobileDev(request)`, sets up a local run of one product mobile app: checks the app's template line
 *          out into `.stackra/mobile/<app>` (replacing an earlier run), writes the Expo config and autolinking
 *          excludes from the root runway entry and the line's capabilities (as the mobile job does), points the
 *          template's product module at each product package's `./native` source entry, names the packages' folders
 *          for Metro, and links the line's installed `node_modules`.
 * Boundary: writes only the checkout folder; runs nothing (the CLI prebuilds and runs the app). No EAS, no store
 *           account, no white-label variant. A package is found by name under `<repository>/packages`.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 6); ADR 0439 (decisions 2 and 3); ADR 0481.
 */
import { readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { RunwayInvalidError } from "#core/errors/runway-invalid.error";
import { MOBILE_DEV_SETTINGS } from "#node/constants/mobile-dev-settings.constant";
import { capabilityConfig } from "#node/functions/capability-config.function";
import { checkoutLine } from "#node/functions/checkout-line.function";
import { expoConfigOf } from "#node/functions/expo-config-of.function";
import { readRunway } from "#node/functions/read-runway.function";
import { exportSourceOf } from "#node/functions/export-source-of.function";
import { workspacePackages } from "#node/functions/workspace-packages.function";
import type { MobileCapability } from "#node/types/mobile-capability.type";
import type { MobileDev } from "#node/types/mobile-dev.type";
import type { MobileDevRequest } from "#node/types/mobile-dev-request.type";

type Block = Record<string, unknown>;

/** The JSON object at `file`. */
const readJson = (file: string): Block => JSON.parse(readFileSync(file, "utf8")) as Block;

/**
 * Prepares the app's checkout.
 *
 * @throws RunwayInvalidError when the app is not in the runway `mobile`, a package is not in the workspace or has no
 *         `./native` export, or a capability is not offered by the line.
 * @example
 * const dev = await prepareMobileDev({
 *   repository: ".", app: "app", line: { scope: "@figentra", local: "../os/apps/mobile" },
 *   nodeModules: "../os/apps/mobile/node_modules",
 * });
 */
export async function prepareMobileDev(request: MobileDevRequest): Promise<MobileDev> {
  const repository = resolve(request.repository);
  const root = readRunway(join(repository, "runway.yaml"), "root");
  const at = `mobile.${request.app}`;
  const entry = root.mobile?.[request.app];
  if (entry === undefined)
    throw new RunwayInvalidError("runway.yaml", [
      { path: at, message: "No such mobile app in the root runway" },
    ]);

  const workspace = workspacePackages(repository);
  const issues: { path: string; message: string }[] = [];
  const entries = (entry.packages ?? []).flatMap((name, index) => {
    const pkg = workspace.get(name);
    const target =
      pkg === undefined ? undefined : exportSourceOf(pkg, MOBILE_DEV_SETTINGS.nativeExport);
    if (pkg === undefined || target === undefined) {
      issues.push({
        path: `${at}.packages.${index}`,
        message:
          pkg === undefined
            ? `${name} is not a package under packages/`
            : `${name} has no ${MOBILE_DEV_SETTINGS.nativeExport} export`,
      });
      return [];
    }
    return [target];
  });
  if (issues.length > 0) throw new RunwayInvalidError("runway.yaml", issues);

  const dir = resolve(repository, request.into ?? MOBILE_DEV_SETTINGS.dir(request.app));
  rmSync(dir, { recursive: true, force: true });
  const template = await checkoutLine({ ...request.line, line: entry.template, into: dir });

  const appJson = readJson(join(dir, "app.json"));
  const catalogue = readJson(join(dir, "capabilities.json")) as Record<string, MobileCapability>;
  const capabilities = capabilityConfig(catalogue, entry.capabilities ?? [], `${at}.capabilities`);
  const base = (appJson["expo"] ?? {}) as Block;
  const config = expoConfigOf(base, {
    project: root.project,
    app: request.app,
    entry,
    capabilities,
  });
  writeFileSync(
    join(dir, "app.json"),
    `${JSON.stringify({ ...appJson, expo: config }, null, 2)}\n`,
  );

  const manifest = readJson(join(dir, "package.json"));
  const expo = (manifest["expo"] ?? {}) as Block;
  const autolinking = (expo["autolinking"] ?? {}) as Block;
  const exclude = Array.isArray(autolinking["exclude"]) ? (autolinking["exclude"] as string[]) : [];
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      {
        ...manifest,
        expo: {
          ...expo,
          autolinking: {
            ...autolinking,
            exclude: [...new Set([...exclude, ...capabilities.excludedModules])],
          },
        },
      },
      null,
      2,
    )}\n`,
  );

  const modules = join(dir, MOBILE_DEV_SETTINGS.productModules);
  const imports = entries.map(
    (file, index) => `import * as p${index} from ${JSON.stringify(file)};`,
  );
  writeFileSync(
    modules,
    [
      "// Written by Runway's local mobile run (prepareMobileDev) from the root runway's packages; never committed.",
      ...imports,
      "",
      `export const PRODUCT_MODULES: readonly { readonly register?: unknown; readonly default?: unknown }[] = [${entries.map((_, index) => `p${index}`).join(", ")}];`,
      "",
    ].join("\n"),
  );
  const roots = (entry.packages ?? []).map((name) => workspace.get(name)?.dir as string);
  writeFileSync(
    join(dir, MOBILE_DEV_SETTINGS.productRoots),
    `${JSON.stringify({ roots }, null, 2)}\n`,
  );
  symlinkSync(
    relative(dir, resolve(repository, request.nodeModules)),
    join(dir, "node_modules"),
    "dir",
  );

  return { dir, template, config, entries };
}
