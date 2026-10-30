/**
 * Stackra file contract:
 * Purpose: `STUDIO_FACES`: the faces the controls offer.
 *          - UI faces (`latin`, `arabic`), by id: the font stack; their labels are catalogue words.
 *          - Display faces (`display`, `displayArabic`): CSS family names, every approved brand's display face and the
 *            UI faces, loaded by `styles/brand-fonts.css` and @stackra/tokens.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10); ADR 0340 (decision 2).
 */

/** The faces the controls offer. */
export const STUDIO_FACES = {
  latin: [
    { id: "geist", stack: '"Geist", ui-sans-serif, system-ui, sans-serif' },
    { id: "system", stack: 'system-ui, "Segoe UI", sans-serif' },
    { id: "serif", stack: "ui-serif, Georgia, serif" },
    { id: "mono", stack: '"Geist Mono", ui-monospace, monospace' },
  ],
  arabic: [
    {
      id: "plex",
      stack: '"IBM Plex Sans Arabic", "Geist", system-ui, "Segoe UI", "Tahoma", sans-serif',
    },
    { id: "system", stack: 'system-ui, "Segoe UI", "Tahoma", sans-serif' },
  ],
  display: [
    "Geist",
    "Geist Mono",
    "Barlow",
    "Bodoni Moda",
    "Bricolage Grotesque",
    "Cormorant Garamond",
    "Fraunces",
    "Readex Pro",
  ],
  displayArabic: [
    "IBM Plex Sans Arabic",
    "Baloo Bhaijaan 2",
    "Cairo",
    "El Messiri",
    "Markazi Text",
    "Readex Pro",
    "Tajawal",
  ],
} as const;
