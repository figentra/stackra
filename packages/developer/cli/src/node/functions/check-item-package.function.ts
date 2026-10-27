/**
 * Stackra file contract:
 * Purpose: `checkItemPackage(dir)`, what `stackra publish` refuses in the member at `dir` before packing: a
 *          `stackra` field `STACKRA_MANIFEST_SCHEMA` refuses, a scope other than `@stackra` or `@stackra-pro`, a
 *          non-package item not named `@<scope>/<kind>-<name>` for its own kind, a package named like an item, and a
 *          skill without `SKILL.md` or an agent without `agent.md` at its root. Returns one line per problem.
 * Boundary: reads `package.json` and checks file existence only. The licence, provenance and integrity checks of a
 *           publish are the registry Worker's (ADR 0453 decision 7).
 * Runtime: node
 * Governing contract: ADR 0453 (decisions 7, 10 and 11).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ITEM_PACKAGE_NAME_PATTERN,
  STACKRA_MANIFEST_SCHEMA,
  StackraKind,
} from "@stackra/skills/contracts";

import { ITEM_REQUIRED_FILES } from "#node/constants/item-required-files.constant";
import { ITEM_SCOPES } from "#node/constants/item-scopes.constant";

/**
 * The problems that keep the member at `dir` from being published.
 *
 * @param dir - the member root (holds `package.json`).
 * @example
 * checkItemPackage("/repo/.agents/skills/archify"); // [] when it can be packed
 */
export function checkItemPackage(dir: string): string[] {
  const file = join(dir, "package.json");
  if (!existsSync(file)) return [`no package.json in ${dir}`];
  const { name, stackra } = JSON.parse(readFileSync(file, "utf8")) as {
    name?: unknown;
    stackra?: unknown;
  };
  if (typeof name !== "string") return ["package.json has no name"];
  const parsed = STACKRA_MANIFEST_SCHEMA.safeParse(stackra ?? {});
  if (!parsed.success) {
    return parsed.error.issues.map(
      (issue) => `stackra.${issue.path.join(".") || "kind"}: ${issue.message}`,
    );
  }
  const { kind } = parsed.data;
  const problems: string[] = [];
  if (!ITEM_SCOPES.some((scope) => name.startsWith(`${scope}/`))) {
    problems.push(`${name} is not in ${ITEM_SCOPES.join(" or ")}`);
  }
  const item = ITEM_PACKAGE_NAME_PATTERN.exec(name)?.groups;
  if (kind === StackraKind.Package && item !== undefined) {
    problems.push(`${name} is named like a ${item["kind"]} item but stackra.kind is package`);
  }
  if (kind !== StackraKind.Package && item?.["kind"] !== kind) {
    problems.push(`a ${kind} item must be named @<scope>/${kind}-<name>, not ${name}`);
  }
  const required = ITEM_REQUIRED_FILES[kind];
  if (required !== undefined && !existsSync(join(dir, required))) {
    problems.push(`a ${kind} item needs ${required} at its root`);
  }
  return problems;
}
