/**
 * Stackra file contract:
 * Purpose: `fillTemplateTokens(path, text)`, a scaffold template's text with `pnpm new`'s tokens (`{{NAME}}`, `{{PORT}}`,
 *          …) set to sample values, so the YAML and runway checks read a template as the member it renders to
 *          (`port: {{PORT}}` is a number once rendered, a flow mapping before).
 * Boundary: pure; any path outside `tools/scaffold/templates/` comes back unchanged.
 * Runtime: node
 * Governing contract: ADR 0126 (scaffold templates); ADR 0296; the YAML standard (STA-299).
 */

/** The sample value of each token `tools/scripts/scaffold.mjs` replaces (its `TOKEN_RE`). */
const SAMPLE_TOKENS: Readonly<Record<string, string>> = {
  NAME: "sample",
  PASCAL: "Sample",
  TITLE: "Sample",
  DESCRIPTION: "A sample member",
  PORT: "3334",
  CATEGORY: "foundation",
  ENTRIES: "",
};
/** A token as the scaffold matches it, spaces inside the braces allowed. */
const TOKEN = /\{\{\s*(NAME|PASCAL|TITLE|DESCRIPTION|PORT|CATEGORY|ENTRIES)\s*\}\}/g;

/**
 * The text a check reads for `path`: a scaffold template rendered with sample tokens, anything else as it is.
 *
 * @param path - repository-relative.
 * @param text - the file's contents.
 * @example
 * fillTemplateTokens("tools/scaffold/templates/apps/docs/runway.yaml", "port: {{PORT}}\n"); // "port: 3334\n"
 */
export function fillTemplateTokens(path: string, text: string): string {
  if (!path.startsWith("tools/scaffold/templates/")) return text;
  return text.replace(TOKEN, (_, key: string) => SAMPLE_TOKENS[key] ?? "");
}
