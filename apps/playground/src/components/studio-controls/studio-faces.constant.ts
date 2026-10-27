/**
 * Stackra file contract:
 * Purpose: `STUDIO_FACES`: the faces the controls offer, by id: a label and the font stack.
 * Boundary: data only, in its own file.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0305 (rule 10).
 */

/** The faces the controls offer, by id: a label and the font stack. */
export const STUDIO_FACES = {
  latin: [
    { id: "geist", label: "Geist", stack: '"Geist", ui-sans-serif, system-ui, sans-serif' },
    { id: "system", label: "System", stack: 'system-ui, "Segoe UI", sans-serif' },
    { id: "serif", label: "Serif", stack: "ui-serif, Georgia, serif" },
    { id: "mono", label: "Geist Mono", stack: '"Geist Mono", ui-monospace, monospace' },
  ],
  arabic: [
    {
      id: "plex",
      label: "IBM Plex Sans Arabic",
      stack: '"IBM Plex Sans Arabic", "Geist", system-ui, "Segoe UI", "Tahoma", sans-serif',
    },
    { id: "system", label: "System", stack: 'system-ui, "Segoe UI", "Tahoma", sans-serif' },
  ],
} as const;
