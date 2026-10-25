/**
 * Stackra file contract:
 * Purpose: `NEW_COMMAND`, `stackra new <package|service|seed-pack> <name> [--category <c>] [--area <a>]
 *          [--description <text>]`: writes a new member in the programming model v3 shape (`packages/<category>/<name>`,
 *          `services/<name>`) or a product seed pack (`seed-packs/<name>`) at the workspace root, then names the next
 *          steps. It refuses a folder that exists, a name that is not kebab-case, a category with no folder under
 *          `packages/`, and an area that is not an `ApiArea`.
 * Boundary: writes only the one new folder; never installs, formats or runs gen (the next steps say to). A
 *           package gets the workspace LICENSE when there is one. App kinds stay with `pnpm new` until their
 *           templates move here.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3 and consequences: `new` moves in from `tools/scripts`); ADR 0294 (rule
 *                     R12); ADR 0295; ADR 0082 (API areas); config-model section 6 (seed packs).
 */
import { copyFileSync, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import { ApiArea, Enum } from "@stackra/contracts";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { packageTemplate } from "#node/functions/package-template.function";
import { seedPackTemplate } from "#node/functions/seed-pack-template.function";
import { serviceTemplate } from "#node/functions/service-template.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";
import type { TemplateFile } from "#node/types/template-file.type";

/** A kebab-case name. */
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The kinds `stackra new` makes. */
const KINDS = ["package", "service", "seed-pack"];

/** `stackra new`. */
export const NEW_COMMAND: CliCommand = {
  name: "new",
  summary: "Create a package, a service or a product seed pack in the v3 shape",
  usage:
    "stackra new <package|service|seed-pack> <name> [--category <c>] [--area <a>] [--description <text>]",
  options: {
    category: { type: "string" },
    area: { type: "string" },
    description: { type: "string" },
  },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [kind, name, ...extra] = positionals;
    if (kind === undefined || !KINDS.includes(kind))
      throw new CliUsageError(`name the kind: ${KINDS.join(", ")}`);
    if (name === undefined || !KEBAB.test(name))
      throw new CliUsageError("name it in kebab-case, such as loyalty-kit");
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    const root = workspaceRoot(cwd);
    const pascal = name.replace(/(^|-)([a-z0-9])/g, (_match, _dash: string, letter: string) =>
      letter.toUpperCase(),
    );
    const description =
      typeof values["description"] === "string" && values["description"].trim() !== ""
        ? values["description"].trim()
        : `@stackra ${kind} ${name}.`;

    let folder: string;
    let files: readonly TemplateFile[];
    if (kind === "package") {
      const category = values["category"];
      if (typeof category !== "string" || !KEBAB.test(category) || category === "tooling")
        throw new CliUsageError(
          "a package needs --category <folder under packages/>, such as data",
        );
      const categoryFolder = join(root, "packages", category);
      if (!existsSync(categoryFolder) || !statSync(categoryFolder).isDirectory())
        throw new CliUsageError(
          `packages/${category} does not exist; pick an existing category folder`,
        );
      folder = join(categoryFolder, name);
      files = packageTemplate({ name, pascal, description, category });
    } else if (kind === "service") {
      const areas = Enum.values(ApiArea).map(String);
      const area = values["area"];
      if (typeof area !== "string" || !areas.includes(area))
        throw new CliUsageError(`a service needs --area ${areas.join("|")}`);
      folder = join(root, "services", name);
      files = serviceTemplate({
        name,
        pascal,
        description,
        area: area.charAt(0).toUpperCase() + area.slice(1),
      });
    } else {
      folder = join(root, "seed-packs", name);
      files = seedPackTemplate({ name, pascal, description });
    }

    if (existsSync(folder)) throw new CliUsageError(`${relative(root, folder)} already exists`);
    for (const file of files) {
      const target = join(folder, file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
    if (kind === "package" && existsSync(join(root, "LICENSE")))
      copyFileSync(join(root, "LICENSE"), join(folder, "LICENSE"));

    const where = relative(root, folder);
    io.out(
      kind === "seed-pack"
        ? `created ${where}\nnext: add records under profiles/, then \`stackra seed-pack ${name} --check\`\n`
        : `created ${where}\nnext: \`pnpm install\`, then \`stackra gen\` in ${where}\n`,
    );
    return 0;
  },
};
