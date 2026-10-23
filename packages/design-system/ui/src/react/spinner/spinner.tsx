/**
 * Stackra file contract:
 * Purpose: the web `Spinner` on HeroUI v3: maps the shared contract onto HeroUI's spinner (`tone` to its colour, or
 *          `current` with the role's inline colour for `default` and `muted`; `label` to `aria-label`, or hidden when
 *          there is none) and passes every other HeroUI prop through unchanged.
 * Boundary: no styling of its own beyond the role's inline colour; the look, size and reduced-motion rule are
 *          HeroUI's, themed by `@stackra/tokens`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0304; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import { Spinner as HeroSpinner, type SpinnerRootProps } from "@heroui/react";
import type { ComponentPropsWithRef } from "react";

import type { TextTone } from "#contracts/enums/text-tone.enum";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** HeroUI's props for a `span` spinner: its own props plus the `span` attributes, as its generic signature spreads them. */
type HeroSpinnerProps = SpinnerRootProps<"span"> &
  Omit<ComponentPropsWithRef<"span">, keyof SpinnerRootProps<"span">>;

/**
 * Props of the web Spinner: the shared contract plus HeroUI v3's own spinner props, passed through unchanged.
 * HeroUI's `color` is the contract's `tone`, `label` owns the accessible name, and HeroUI draws its own SVG.
 */
export type SpinnerProps = SpinnerContractProps &
  Omit<
    HeroSpinnerProps,
    keyof SpinnerContractProps | "color" | "aria-label" | "aria-hidden" | "children"
  >;

/**
 * HeroUI's colour of each tone and the inline role colour that goes with it. HeroUI has no foreground or muted
 * colour, so those draw as `current` with a theme variable; typed over every tone so a new one needs a colour.
 */
const SPINNER_COLOR: Readonly<
  Record<TextTone, readonly [NonNullable<SpinnerRootProps["color"]>, string | undefined]>
> = Object.freeze({
  default: ["current", "var(--foreground)"],
  muted: ["current", "var(--muted)"],
  accent: ["accent", undefined],
  success: ["success", undefined],
  warning: ["warning", undefined],
  danger: ["danger", undefined],
});

/**
 * An indeterminate wait. With a `label` it is one named status; without one it is decoration and hidden from
 * assistive technology, so the text beside it must say what is loading. HeroUI's English "Loading" never shows.
 */
export function Spinner({ size, tone = "accent", label, style, ...rest }: SpinnerProps) {
  const [color, roleColor] = SPINNER_COLOR[tone];
  return (
    <HeroSpinner
      {...rest}
      {...omitUndefined({ size })}
      color={color}
      // The caller's style comes last, so its own colour wins over the role's.
      style={roleColor ? { color: roleColor, ...style } : style}
      {...(label ? { "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
