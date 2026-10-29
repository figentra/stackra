/**
 * Stackra file contract:
 * Purpose: `readAppDefinition`, an app's `defineApp` argument as static data (its `name`, `scheme` and tool sections,
 *          which the Expo config is written from) and the alternate icon sets the brand kit wrote under
 *          `assets/app-icons/<Name>/`.
 * Boundary: reads `stackra.config.ts` as text and never runs it (`staticLiteral`); a member that calls no `defineApp`
 *           gets nothing. An argument that is not static data is refused as `app_definition_not_static`.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 1, 2 and 4.5: icons are derived); ADR 0250 (decision 2: alternate icons).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { staticLiteral } from "#core/functions/static-literal.function";
import type { GenError } from "#core/types/gen-error.type";
import type { MemberIR } from "#core/types/member-ir.type";

/** The folder of the brand kit's alternate icon sets, one PascalCase folder per icon. */
const ICON_SETS = join("assets", "app-icons");

/**
 * The `defineApp` data and alternate icon sets of the member at `root`.
 *
 * @param root - the member root.
 * @example
 * readAppDefinition("apps/mobile").app?.definition["scheme"]; // "stackra"
 */
export function readAppDefinition(root: string): {
  readonly app?: MemberIR["app"];
  readonly errors: readonly GenError[];
} {
  const path = join(root, "stackra.config.ts");
  if (!existsSync(path)) return { errors: [] };
  const text = readFileSync(path, "utf8");
  const call = /\bdefineApp\s*\(/.exec(text);
  if (call === null) return { errors: [] };
  let definition: unknown;
  try {
    definition = staticLiteral(text.slice(call.index + call[0].length)).value;
  } catch (error) {
    definition = error instanceof Error ? error : undefined;
  }
  if (typeof definition !== "object" || definition === null || Array.isArray(definition))
    return {
      errors: [
        {
          code: "app_definition_not_static",
          file: "stackra.config.ts",
          line: text.slice(0, call.index).split("\n").length,
          column: 0,
          subject: "defineApp",
          message: `the defineApp argument is not static data${definition instanceof Error ? ` (${definition.message})` : ""}`,
          fix: "pass one object of literals and enum cases: no spread, call, shorthand or computed key",
        },
      ],
    };
  const folder = join(root, ICON_SETS);
  const icons = existsSync(folder)
    ? readdirSync(folder, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && /^[A-Z][A-Za-z0-9]*$/.test(entry.name))
        .map((entry) => entry.name)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort()
    : [];
  return { app: { definition: definition as Record<string, unknown>, icons }, errors: [] };
}
