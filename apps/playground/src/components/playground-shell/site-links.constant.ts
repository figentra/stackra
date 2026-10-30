/**
 * Stackra file contract:
 * Purpose: `SITE_LINKS`, the top bar's places in order: Components, Theme Studio and Docs (the Docs
 *          home, `/docs`), each with the shell key of its label.
 * Boundary: data only; the top bar and the menu drawer draw it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5).
 */
import { SHELL_KEYS } from "./shell-keys.constant";

/** The top bar's places. */
export const SITE_LINKS = [
  { id: "components", path: "/components", label: SHELL_KEYS.shell.components },
  { id: "studio", path: "/theme-studio", label: SHELL_KEYS.shell.studio },
  { id: "docs", path: "/docs", label: SHELL_KEYS.shell.docs },
] as const;
