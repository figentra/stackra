/**
 * Stackra file contract:
 * Purpose: `DropdownItemProps`: props of `Dropdown.Item`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (UI
 *          contract, HeroUI v3 on web); ADR 0303 (decision 7); owner decision 6 of STA-350 (thin wrappers); explicit
 *          compound type so the declaration emit is self-contained (STA-1220).
 */
import type { DropdownItemProps as HeroDropdownItemProps } from "@heroui/react";
import type { Tone } from "@stackra/contracts";
import type { ReactNode } from "react";

/** Props of `Dropdown.Item`: HeroUI's item props with the label as children, a `description` and a `color`. */
export type DropdownItemProps = Omit<HeroDropdownItemProps, "children" | "variant"> & {
  /** The label of the item. */
  readonly children?: ReactNode;
  /** A second, muted line under the label. */
  readonly description?: ReactNode;
  /** The tone of the item; `danger` marks a destructive action. Defaults to `default`. */
  readonly color?: Tone | undefined;
};
