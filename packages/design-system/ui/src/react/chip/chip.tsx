/**
 * Stackra file contract:
 * Purpose: the web `Chip` on HeroUI v3's Chip: maps the shared contract (`tone` to `color`, one default of
 *          `secondary`/`default`/`md`, text into `Chip.Label`, icons sized to the text) and passes every other HeroUI
 *          prop through, `onClick` excepted.
 * Boundary: a display element with no behaviour; no styling of its own beyond the one icon-size utility; the look is
 *          HeroUI's, themed by `@stackra/tokens`. Interaction is a TagGroup or a Button, never a chip.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0304 (decision 3); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import { Chip as HeroChip, cn } from "@heroui/react";

import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { ChipProps } from "#react/chip/chip.props";

/**
 * A compact, non-interactive label. Every combination of variant, tone and size draws as the same chip on web and
 * native: HeroUI's web defaults are passed explicitly. Icons follow the text size.
 */
export function Chip({
  variant = "secondary",
  tone = "default",
  size = "md",
  startIcon,
  endIcon,
  children,
  className,
  ...rest
}: ChipProps) {
  // HeroUI wraps a lone string in the label itself, but not beside an icon, where the label would lose its padding.
  const isText = typeof children === "string" || typeof children === "number";
  return (
    <HeroChip
      {...rest}
      variant={variant}
      color={tone}
      size={size}
      // `size-[1em]`: HeroUI sizes no icon inside a chip; the text's own size is the one that fits.
      className={cn("[&_svg]:size-[1em]", className) ?? ""}
    >
      <SlotIcon icon={startIcon} />
      {isText ? <HeroChip.Label>{children}</HeroChip.Label> : children}
      <SlotIcon icon={endIcon} />
    </HeroChip>
  );
}
