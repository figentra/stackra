/**
 * Stackra file contract:
 * Purpose: the development warning for an icon name no registry holds, so a control or glyph that vanishes does not
 *          do so in silence.
 * Boundary: writes one `console.warn` per name; the caller decides whether it runs (development only), because the
 *          web and native runtimes tell development apart differently.
 * Runtime: isomorphic
 * Governing contract: ADR 0303 (decision 10).
 */

/** The names already warned about, so a re-render or a list of the same icon does not flood the console. */
const WARNED = new Set<string>();

/**
 * Warns once per name that no registry holds it. Until gen refuses unknown names, this is the only signal a
 * missing registration gives; a labelled icon is meaningful, so the warning says when one is lost.
 */
export function warnUnknownIcon(name: string, label?: string): void {
  if (WARNED.has(name)) return;
  WARNED.add(name);
  const lost = label ? ` (labelled "${label}", so it is meaningful)` : "";
  console.warn(
    `@stackra/ui: the icon "${name}"${lost} is in no registry and draws nothing. Register it with an IconRegistryProvider.`,
  );
}
