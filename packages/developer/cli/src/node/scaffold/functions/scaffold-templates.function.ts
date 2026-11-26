/**
 * Stackra file contract:
 * Purpose: `scaffoldTemplates(home, shipped?)`, the template folder `scaffold` renders from: the workspace's own
 *          `tools/scaffold/templates` when it has one (core authors them; a product may keep its own), else the copy
 *          shipped inside `@stackra/cli` (`dist/scaffold-templates`), which is what an app made by `stackra create`
 *          uses (STA-1954).
 * Boundary: reads folder existence only.
 * Runtime: node
 * Governing contract: ADR 0126 (member shapes and scaffold templates); ADR 0282 (decision 3: `new` is published);
 *                     ADR 0515 (a created app is a product repository).
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

import { cliPackageRoot } from "#node/functions/cli-package-root.function";
import { SCAFFOLD_TEMPLATE_PATHS } from "#node/scaffold/constants/scaffold-template-paths.constant";

/** Whether `path` is a folder. */
const isFolder = (path: string): boolean => existsSync(path) && statSync(path).isDirectory();

/**
 * The scaffold template folder for the workspace at `home`.
 *
 * @param home - the workspace root whose own templates win.
 * @param shipped - the shipped copy; `<@stackra/cli>/dist/scaffold-templates` by default.
 * @throws Error when neither folder exists (a CLI built without its templates).
 * @example
 * scaffoldTemplates("/repo/acme"); // "/repo/acme/node_modules/@stackra/cli/dist/scaffold-templates"
 */
export function scaffoldTemplates(
  home: string,
  shipped: string = join(cliPackageRoot(), SCAFFOLD_TEMPLATE_PATHS.shipped),
): string {
  const authored = join(home, SCAFFOLD_TEMPLATE_PATHS.repository);
  if (isFolder(authored)) return authored;
  if (isFolder(shipped)) return shipped;
  throw new Error(
    `no scaffold templates: ${SCAFFOLD_TEMPLATE_PATHS.repository} is not in ${home} and @stackra/cli ships none at ${shipped}; reinstall @stackra/cli`,
  );
}
