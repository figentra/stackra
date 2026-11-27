/**
 * Stackra file contract:
 * Purpose: `askNew(io, given, cwd)`, the answers `stackra new` runs with: in a terminal, whatever the invocation left
 *          out of what the kind needs is asked, in order: the kind (a select of every kind the body names in its usage),
 *          the name (kebab-case), then a service its API area (a select), a package its category (a select of the
 *          category folders that exist), and a template kind (`tooling`, `app:*`, a package with `--entries` or
 *          `--data`) its description and summary. Without a terminal (CI, a pipe, `--json`, `--no-interaction`) it
 *          asks nothing the body already refuses with exit 2 naming the flag (kind, name, `--area`, `--category`), and
 *          a template kind's missing `--description` or `--summary` exits 2 naming that flag (it used to exit 1).
 * Boundary: asks through `io.prompt` only and writes nothing; an answer given on the line is never asked again. The
 *           kinds come from the body's own usage, so a kind the body learns is offered without touching this file.
 * Runtime: node
 * Governing contract: ADR 0506; STA-1966 spec FR-018 (prompted fields); STA-1730 spec FR-023 (a prompt without a
 *                     terminal exits 2 naming the option); STA-2883.
 */
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import type { CommandIo } from "@stackra/console";
import type { PromptChoice } from "@stackra/console/contracts";
import { ApiArea, Enum } from "@stackra/contracts";
import { CATEGORY_NAMES } from "@stackra/repo-checks/node";

import { newKinds } from "#node/functions/new-kinds.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import { SCAFFOLD_KINDS } from "#node/scaffold/constants/scaffold-kinds.constant";
import type { NewAnswers } from "#node/types/new-answers.type";

/** A kebab-case name, as the body checks it. */
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The kinds the body makes from the CLI's own templates; the other scaffold kinds render from tools/scaffold. */
const OWN_KINDS = new Set(["package", "service", "seed-pack"]);

/** The category folders under `packages/` a new package can go in (tooling has its own kind). */
function categoriesIn(root: string, templated: boolean): string[] {
  const folder = join(root, "packages");
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && KEBAB.test(entry.name) && entry.name !== "tooling")
    .map((entry) => entry.name)
    .filter((name) => !templated || CATEGORY_NAMES.includes(name))
    .toSorted();
}

/** A check that refuses a blank answer. */
const notBlank = (what: string) => (answer: string) =>
  answer.trim() === "" ? `${what} cannot be empty` : undefined;

/**
 * The answers with what the kind needs asked for (in a terminal), or refused by flag (a template kind without one).
 *
 * @param io - the command's io: its prompts and whether the run is interactive.
 * @param given - what the invocation gave.
 * @param cwd - the working directory (the workspace root and `--repo` resolve from it).
 * @throws NonInteractivePromptError (exit 2, `Pass --description` or `Pass --summary`) for a template kind without a
 *         terminal and without that flag.
 * @example
 * const answers = await askNew(io, { kind: "service", name: "billing" }, io.cwd); // asks the area
 */
export async function askNew(io: CommandIo, given: NewAnswers, cwd: string): Promise<NewAnswers> {
  const asking = io.interactive;
  let { kind, name, category, area, description, summary } = given;

  if (kind === undefined && asking)
    kind = await io.prompt.select({
      message: "What do you want to create?",
      choices: newKinds().map((value): PromptChoice => ({ value })),
    });
  if (name === undefined && asking)
    name = await io.prompt.text({
      message: kind === undefined ? "Its name?" : `The ${kind}'s name?`,
      placeholder: "loyalty-kit",
      validate: (answer) =>
        KEBAB.test(answer) ? undefined : "name it in kebab-case, such as loyalty-kit",
    });
  // Without a kind and a name the body refuses the line itself (exit 2), so nothing else is asked.
  if (kind === undefined || name === undefined) return { ...given, kind, name };

  const templated =
    (!OWN_KINDS.has(kind) && Object.hasOwn(SCAFFOLD_KINDS, kind)) ||
    (kind === "package" && (given.entries !== undefined || given.data === true));
  const root = given.repo === undefined ? workspaceRoot(cwd) : resolve(cwd, given.repo);

  if (kind === "service" && area === undefined && asking)
    area = await io.prompt.select({
      message: "Which API area does the service serve?",
      option: "area",
      choices: Enum.values(ApiArea).map((value): PromptChoice => ({ value: String(value) })),
    });
  if (kind === "package" && category === undefined && asking) {
    const categories = categoriesIn(root, templated);
    const question = { message: "Which category folder under packages/?", option: "category" };
    category =
      categories.length > 0
        ? await io.prompt.select({
            ...question,
            choices: categories.map((value): PromptChoice => ({ value })),
          })
        : await io.prompt.text({
            ...question,
            placeholder: "data",
            validate: notBlank("The category"),
          });
  }
  if (templated && (description === undefined || description.trim() === ""))
    description = await io.prompt.text({
      message: "Describe it in one sentence (package.json, README.md and AGENTS.md open with it)",
      option: "description",
      validate: notBlank("The description"),
    });
  if (templated && (summary === undefined || summary.trim() === "")) {
    const said = description?.trim();
    summary = await io.prompt.text({
      message: "When should an agent reach for it? One sentence (stackra.summary)",
      option: "summary",
      validate: (answer) =>
        answer.trim() === ""
          ? "The summary cannot be empty"
          : answer.trim() === said
            ? "Say when to reach for it, not what it is (that is the description)"
            : undefined,
    });
  }
  return { ...given, kind, name, category, area, description, summary };
}
