/**
 * Stackra file contract:
 * Purpose: `renderCatalogue(entries)`, the text of `@stackra/gen`'s `error-codes.constant.ts`: its file contract and
 *          `ERROR_CODES`, the reference rows as plain data. `pnpm error-codes:write` writes it and formats it with
 *          oxfmt; the catalogue test compares the committed rows with the page's, so the copy never drifts from it.
 * Boundary: pure; every string is written with `JSON.stringify`, so a cell's quotes, backslashes and backticks survive.
 * Runtime: node
 * Governing contract: STA-2853 (the page); STA-2891 (one catalogue for the terminal, the page and the MCP).
 */
import type { ErrorCodeEntry } from "@stackra/gen";

/** The file contract of the written file. */
const HEADER = `/**
 * Stackra file contract:
 * Purpose: \`ERROR_CODES\`, every code the error-code reference (\`customers/error-codes\` on the docs site) lists:
 *          gen's refusals and warnings, the rules of \`stackra check\`, and Runway's issue codes and errors, each with
 *          its tool, its group and that group's heading id, its cause and its fix. Gen's docs line, \`stackra explain\`
 *          and the local MCP's \`explain\` tool read it.
 * Boundary: data only, written by apps/docs \`pnpm error-codes:write\` from the page; never edit it by hand. The page is
 *           the source: change a row there and write this file again. apps/docs's catalogue test fails when these rows
 *           and the page's differ, or when gen can print a code it does not list.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decisions 22 and 26); STA-2853; STA-2891.
 */
import type { ErrorCodeEntry } from "#core/types/error-code-entry.type";

/** Every code of the error-code reference, in page order. */
export const ERROR_CODES: readonly ErrorCodeEntry[] = [
`;

/**
 * The text of the catalogue file holding `entries`.
 *
 * @param entries - the reference rows, in page order.
 * @returns the file's text, ending in a newline.
 * @example
 * renderCatalogue(catalogueEntries(readFileSync(page, "utf8")));
 */
export function renderCatalogue(entries: readonly ErrorCodeEntry[]): string {
  const rows = entries.map(
    (entry) =>
      `  {\n${(["code", "tool", "group", "anchor", "cause", "fix"] as const)
        .map((key) => `    ${key}: ${JSON.stringify(entry[key])},`)
        .join("\n")}\n  },\n`,
  );
  return `${HEADER}${rows.join("")}];\n`;
}
