/**
 * Stackra file contract:
 * Purpose: the props a `ToggleButton` takes on both runtimes: a button that stays pressed or not (bold, mute, a filter), alone or in a ToggleButtonGroup. The names are React Aria's, which the web re-export of HeroUI v3 takes as they are.
 * Boundary: types only. The web entry re-exports HeroUI's own ToggleButton, which takes these and more; native implements exactly these.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web (HeroUI) and native `ToggleButton`. */
export interface ToggleButtonContractProps {
  /** The key the group's selection holds; required inside a ToggleButtonGroup. */
  readonly id?: string | undefined;
  /** The content: words, or an icon with `isIconOnly`. */
  readonly children?: ReactNode;
  /** Pressed or not, for a controlled button; pair it with `onChange`. Ignored inside a group. */
  readonly isSelected?: boolean | undefined;
  /** Pressed at the start, for an uncontrolled button. Ignored inside a group. */
  readonly defaultSelected?: boolean | undefined;
  /** Called with the new state on every press. */
  readonly onChange?: ((isSelected: boolean) => void) | undefined;
  /** `default` is a filled button, `ghost` has no fill until pressed. Defaults to `default`. */
  readonly variant?: "default" | "ghost" | undefined;
  /** The size. Defaults to `md`. */
  readonly size?: Size | undefined;
  /** True for a square icon button; then name it with `aria-label` on web, `label` on native. */
  readonly isIconOnly?: boolean | undefined;
  /** True to refuse presses. */
  readonly isDisabled?: boolean | undefined;
}
