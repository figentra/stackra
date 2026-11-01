/**
 * Stackra file contract:
 * Purpose: `linkConsumerWorkspace(text, links)`, a consumer's `pnpm-workspace.yaml` with each catalog `@stackra/*`
 *          entry and an `overrides:` row pointing at the core link (an override also covers a transitive
 *          `@stackra/*` dependency).
 * Boundary: pure; other rows are left byte for byte.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/**
 * Rewrites the workspace text.
 *
 * @param text - the consumer's `pnpm-workspace.yaml`.
 * @param links - package name to `link:<path>`, from `listCoreLinks`.
 * @example
 * linkConsumerWorkspace('catalog:\n  "@stackra/model": 0.3.0\n', { "@stackra/model": "link:/c/model" });
 */
export function linkConsumerWorkspace(
  text: string,
  links: Readonly<Record<string, string>>,
): string {
  const catalog = text.replaceAll(
    /^(\s+)"?(@stackra\/[^":]+)"?: .*$/gm,
    (row: string, space: string, name: string) =>
      links[name] ? `${space}"${name}": "${links[name]}"` : row,
  );
  const rows = `${Object.entries(links)
    .map(([name, link]) => `  "${name}": "${link}"`)
    .join("\n")}\n`;
  return /^overrides:\n/m.test(catalog)
    ? catalog.replace(/^overrides:\n/m, `overrides:\n${rows}`)
    : `${catalog}\noverrides:\n${rows}`;
}
