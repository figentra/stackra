/**
 * Stackra file contract:
 * Purpose: `AppearanceToggleProps`, what a host hands the web AppearanceToggle: its name and help text, the look
 *          (segmented, switch or menu), an optional controlled scheme with its change handler, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The scheme is the container's
 *           `ColorSchemeService`, read through `useColorScheme`; `value` only overrides what is shown, for a preview.
 *           The words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0060 (light and dark); ADR 0305; UI build list spec
 *                     2026-11-02 (prop changes: AppearanceToggle is the colour scheme).
 */
import type { ColorScheme } from "@stackra/ui/contracts";
import type { ReactNode } from "react";

/**
 * The toggle's look, handlers and words.
 *
 * @example
 * <AppearanceToggle variant="menu" label="Appearance" labels={{ light: "Light", dark: "Dark", system: "System" }} />
 */
export interface AppearanceToggleProps {
  /** The visible name of the switch, or the spoken name of the segments and the menu, for example "Appearance". */
  readonly label: string;
  /** Help text under the control, tied to it for assistive technology. */
  readonly description?: ReactNode;
  /** True to refuse switching. */
  readonly isDisabled?: boolean | undefined;
  /**
   * The scheme shown, for a controlled toggle (a branding preview); pair it with `onChange`. Left out, the toggle
   * shows and sets the device's chosen scheme.
   */
  readonly value?: ColorScheme | undefined;
  /** Called with the scheme the viewer picks; with `value` left out the choice is already kept on the device. */
  readonly onChange?: ((scheme: ColorScheme) => void) | undefined;
  /**
   * `segmented` shows every scheme on offer side by side (a settings page); `switch` turns dark on and off (a
   * compact header); `menu` is a button that opens the schemes (the landing header). Defaults to `segmented`.
   */
  readonly variant?: "segmented" | "switch" | "menu" | undefined;
  /** Styles the root. */
  readonly className?: string | undefined;
  /** The name of each scheme; the host writes them. */
  readonly labels: {
    /** The light scheme, for example "Light". */
    readonly light: string;
    /** The dark scheme, for example "Dark". */
    readonly dark: string;
    /** Following the operating system, for example "System". */
    readonly system: string;
  };
}
