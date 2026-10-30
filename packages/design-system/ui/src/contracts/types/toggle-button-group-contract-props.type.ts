/**
 * Stackra file contract:
 * Purpose: the props a `ToggleButtonGroup` takes on both runtimes: a row of ToggleButtons where one or several stay pressed (text alignment, filters), joined or apart. The names are React Aria's.
 * Boundary: types only. The web entry re-exports HeroUI's own ToggleButtonGroup; native implements exactly these.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); wave 3c mobile
 *          interactions (owner approval 2026-10-28).
 */
import type { ReactNode } from "react";

import type { Orientation } from "#contracts/enums/orientation.enum";
import type { Size } from "#contracts/enums/size.enum";

/** Props shared by the web (HeroUI) and native `ToggleButtonGroup`. */
export interface ToggleButtonGroupContractProps {
  /** The ToggleButtons, each with an `id`. */
  readonly children?: ReactNode;
  /** One pressed at a time, or several. Defaults to `single`. */
  readonly selectionMode?: "single" | "multiple" | undefined;
  /** The ids pressed, for a controlled group; pair it with `onSelectionChange`. */
  readonly selectedKeys?: Iterable<string> | undefined;
  /** The ids pressed at the start, for an uncontrolled group. */
  readonly defaultSelectedKeys?: Iterable<string> | undefined;
  /** Called with the ids now pressed. */
  readonly onSelectionChange?: ((keys: Set<string>) => void) | undefined;
  /** True to keep at least one pressed. */
  readonly disallowEmptySelection?: boolean | undefined;
  /** The axis the buttons run along. Defaults to `horizontal`. */
  readonly orientation?: Orientation | undefined;
  /** The size of every button. */
  readonly size?: Size | undefined;
  /** True to space the buttons apart rather than join them. */
  readonly isDetached?: boolean | undefined;
  /** True to refuse every button. */
  readonly isDisabled?: boolean | undefined;
}
