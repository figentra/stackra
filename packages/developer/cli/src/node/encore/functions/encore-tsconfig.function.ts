/**
 * Stackra file contract:
 * Purpose: `encoreTsconfig(text, imports)`, a service's tsconfig.json as Encore needs it: `compilerOptions.paths` with
 *          each package.json `imports` key and its first target (`pathsOfImports`), and no `baseUrl` (TypeScript 7
 *          removed it; `paths` resolve from the tsconfig's own folder). Encore 1.58's parser ignores package.json
 *          `imports` (its node resolver takes `#modules/x` for a package named `#modules` and fails with "failed to get
 *          the node_modules path") and reads `paths` only from the app root's own tsconfig.json, never through
 *          `extends`, so a service whose tsconfig only extends a preset cannot be parsed by `encore run` (STA-2794).
 * Boundary: pure; text in, text out. The header comments are kept: the `//` lines above the object and those that open
 *           it (a file contract inside the braces). Laid out as the repository's formatter leaves JSON (gen's
 *           `formatJson`). `prepareEncoreService`, `serviceTemplate` and `starterFiles` share it.
 * Runtime: node
 * Governing contract: ADR 0091 (decision 2, amendment of 2026-11-09, rule 4 as corrected 2026-11-10); STA-2794.
 */
import { formatJson } from "@stackra/gen";
import { pathsOfImports, stripJsonc } from "@stackra/repo-checks/node";

/**
 * A tsconfig's header comments: the `//` lines above its object, and those that open the object (a file contract
 * written inside the braces), re-indented as the formatter leaves them.
 */
function headerOf(text: string): { readonly above: string[]; readonly inside: string[] } {
  const lines = text.split("\n");
  const open = lines.findIndex((line) => line.trimStart().startsWith("{"));
  if (open === -1) return { above: [], inside: [] };
  const above = lines.slice(0, open).filter((line) => line.startsWith("//"));
  const inside: string[] = [];
  if (lines[open]?.trim() === "{")
    for (const line of lines.slice(open + 1)) {
      if (!line.trimStart().startsWith("//")) break;
      inside.push(`  ${line.trim()}`);
    }
  return { above, inside };
}

/**
 * The tsconfig text with the Encore `paths` of a service's `imports`.
 *
 * @param text - the current tsconfig.json (JSONC), or undefined when the service has none.
 * @param imports - the service's package.json `imports` value.
 * @example
 * encoreTsconfig('{ "extends": "@stackra/typescript-config/service" }', { "#src/*": ["./src/*", "./src/*.ts"] });
 * // '{\n  "extends": "@stackra/typescript-config/service",\n  "compilerOptions": {\n    "paths": {\n      "#src/*": ["./src/*"]\n    }\n  }\n}\n'
 */
export function encoreTsconfig(text: string | undefined, imports: unknown): string {
  const source = text ?? "";
  const tsconfig = (source.trim() === "" ? {} : JSON.parse(stripJsonc(source))) as {
    compilerOptions?: Record<string, unknown>;
  };
  const header = headerOf(source);
  // TypeScript 7 refuses `baseUrl`; `paths` resolve from the tsconfig's folder without it.
  const compilerOptions: Record<string, unknown> = { ...tsconfig.compilerOptions };
  delete compilerOptions["baseUrl"];
  tsconfig.compilerOptions = { ...compilerOptions, paths: pathsOfImports(imports) };
  const [open = "{", ...body] = formatJson(tsconfig).split("\n");
  return [...header.above, open, ...header.inside, ...body].join("\n");
}
