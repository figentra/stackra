/**
 * Stackra file contract:
 * Purpose: `THEME_FACES`: the faces on offer: the theme's own stack (no knob), or a platform face every device has.
 * Boundary: data only, in its own file.
 * Runtime: react-native
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0302 (Stackra Design System); ADR 0305 (rule 10).
 */

/**
 * The faces on offer: the theme's own stack (no knob), or a platform face every device has. The app bundles no font
 * file, so a face changes the exported theme; native components draw in the system face either way.
 */
export const THEME_FACES: Readonly<
  Record<"latin" | "arabic", readonly { id: string; label: string; stack: string | undefined }[]>
> = {
  latin: [
    { id: "theme", label: "Theme", stack: undefined },
    { id: "system", label: "System", stack: "system-ui, sans-serif" },
    { id: "serif", label: "Serif", stack: "ui-serif, Georgia, serif" },
    { id: "mono", label: "Mono", stack: "ui-monospace, Menlo, monospace" },
  ],
  arabic: [
    { id: "theme", label: "Theme", stack: undefined },
    { id: "system", label: "System", stack: "system-ui, sans-serif" },
  ],
};
