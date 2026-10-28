/**
 * Stackra file contract:
 * Purpose: `NEW_COMMAND`, `stackra new <package|service|seed-pack> <name> [--category <c>] [--area <a>]
 *          [--description <text>] [--summary <text>] [--scope <product|@npm-scope>] [--over]`: writes a new member in
 *          the programming model v3 shape, with the `stackra` field and turbo tags of ADR 0453 decision 11
 *          (`packages/<category>/<name>`, `services/<name>`) or a product seed pack
 *          (`seed-packs/<name>`) at the workspace root, then names the next steps. The package name comes from
 *          `memberNaming` (`--scope`, else the root runway's `product.key`). `--over` regenerates over an existing
 *          member: it writes only the files that are missing and prints a line diff for each authored file that
 *          differs from the template, never writing it. It refuses a folder that exists (without `--over`), a name or
 *          scope that is not kebab-case, a category with no folder under `packages/`, and an area that is not an
 *          `ApiArea`.
 * Boundary: writes only inside the one member folder; never installs, formats or runs gen (the next steps say to).
 *           `--over` never touches `CHANGELOG.md` or an existing `runway.yaml` (its ports and sizes are authored), and
 *           the templates write nothing under `src/`, so `src/modules/` and an authored root module are never
 *           touched. A package gets the workspace LICENSE when it has none yet. App kinds stay with `pnpm new`
 *           until their templates move here.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3 and consequences: `new` moves in from `tools/scripts`); ADR 0294 (rule
 *                     R12); ADR 0295; ADR 0082 (API areas); config-model section 6 (seed packs); ADR 0349 (decision 2: product package
 *                     names); STA-1210 (`--scope`, `--over`).
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

import { ApiArea, Enum } from "@stackra/contracts";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { lineDiff } from "#node/functions/line-diff.function";
import { memberNaming } from "#node/functions/member-naming.function";
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

/** Files `--over` never writes or diffs: release history and the member's authored runtime needs (ports, sizes). */
const KEEP_OVER = new Set(["CHANGELOG.md", "runway.yaml"]);

/** The `stackra new` command. */
export const NEW_COMMAND: CliCommand = {
  name: "new",
  summary:
    "Create a package, a service or a product seed pack in the v3 shape, or regenerate one with --over",
  usage:
    "stackra new <package|service|seed-pack> <name> [--category <c>] [--area <a>] [--description <text>] [--summary <text>] [--scope <product|@npm-scope>] [--over]",
  options: {
    category: { type: "string" },
    area: { type: "string" },
    description: { type: "string" },
    summary: { type: "string" },
    scope: { type: "string" },
    over: { type: "boolean" },
  },
  positionals: true,
  async run({ cwd, positionals, values, io }) {
    const [kind, name, ...extra] = positionals;
    if (kind === undefined || !KINDS.includes(kind))
      throw new CliUsageError(`name the kind: ${KINDS.join(", ")}`);
    if (name === undefined || !KEBAB.test(name))
      throw new CliUsageError("name it in kebab-case, such as loyalty-kit");
    if (extra.length > 0) throw new CliUsageError(`unexpected argument: ${extra[0]}`);
    const scope = typeof values["scope"] === "string" ? values["scope"] : undefined;
    if (scope !== undefined && !KEBAB.test(scope.replace(/^@/, "")))
      throw new CliUsageError("--scope takes a product key (beautilon) or an npm scope (@acme)");
    const over = values["over"] === true;
    const root = workspaceRoot(cwd);
    const pascal = name.replaceAll(/(^|-)([a-z0-9])/g, (_match, _dash: string, letter: string) =>
      letter.toUpperCase(),
    );
    const description =
      typeof values["description"] === "string" && values["description"].trim() !== ""
        ? values["description"].trim()
        : `@stackra ${kind} ${name}.`;
    // `stackra.summary` (ADR 0453 decision 11, amendment of 2026-10-27): when an agent reaches for the member.
    const summary =
      typeof values["summary"] === "string" && values["summary"].trim() !== ""
        ? { summary: values["summary"].trim() }
        : {};

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
      files = packageTemplate({
        name,
        pascal,
        description,
        category,
        ...summary,
        ...memberNaming(root, "package", name, scope),
      });
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
        ...summary,
        ...memberNaming(root, "service", name, scope),
      });
    } else {
      folder = join(root, "seed-packs", name);
      files = seedPackTemplate({ name, pascal, description });
    }

    const where = relative(root, folder);
    if (existsSync(folder) && !over)
      throw new CliUsageError(`${where} already exists; pass --over to regenerate over it`);
    for (const file of files) {
      const target = join(folder, file.path);
      if (existsSync(target)) {
        if (KEEP_OVER.has(file.path)) continue;
        const diff = lineDiff(readFileSync(target, "utf8"), file.content);
        if (diff !== "")
          io.out(`--- ${where}/${file.path} (authored, kept)\n+++ template\n${diff}`);
        continue;
      }
      if (over && file.path === "CHANGELOG.md") continue;
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
      if (over) io.out(`wrote ${where}/${file.path}\n`);
    }
    if (
      kind === "package" &&
      existsSync(join(root, "LICENSE")) &&
      !existsSync(join(folder, "LICENSE"))
    )
      copyFileSync(join(root, "LICENSE"), join(folder, "LICENSE"));

    io.out(
      kind === "seed-pack"
        ? `${over ? "regenerated" : "created"} ${where}\nnext: add records under profiles/, then \`stackra seed-pack ${name} --check\`\n`
        : `${over ? "regenerated" : "created"} ${where}\nnext: \`pnpm install\`, then \`stackra gen\` in ${where}\n`,
    );
    return 0;
  },
};
