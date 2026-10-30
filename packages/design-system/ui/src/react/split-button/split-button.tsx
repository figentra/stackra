/**
 * Stackra file contract:
 * Purpose: the web `SplitButton` on HeroUI v3's ButtonGroup: the primary `Button` joined to an `IconButton` caret that
 *          opens a `Menu` of related actions. The caret turns half a circle while the menu is open (the theme's `fast`
 *          step, none under reduced motion), and both halves share the group's pressed look. Every other ButtonGroup
 *          prop passes through.
 * Boundary: builds on `#react/button/button`, `#react/icon-button/icon-button` and `#react/menu/menu`; no styling of its
 *           own beyond the caret's turn. The group's corners follow the reading direction, so it mirrors in RTL. The
 *           menu opens under the caret, lined up with the group's end.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0312; ADR 0329 (motion layer); owner decision 6 of STA-350 (thin
 *          wrappers); WCAG 2.2 SC 2.1.1, 4.1.2.
 */
import type { ReactElement } from "react";
import { ButtonGroup, cn } from "@heroui/react";
import { useState } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Button } from "#react/button/button";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { Menu } from "#react/menu/menu";
import type { SplitButtonProps } from "#react/split-button/split-button.props";

/** The caret's turn: the theme's fast step, which the stylesheet drops to 0ms under reduced motion. */
const CARET_MOTION =
  "transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none";

/** A primary action with a caret that opens its related actions, for example "Save" with "Save and new". */
export function SplitButton({
  children,
  onPress,
  startIcon,
  menuLabel,
  sections,
  onAction,
  variant = "primary",
  size,
  isDisabled,
  isLoading,
  placement = "bottom",
  align = "end",
  isOpen,
  defaultOpen,
  onOpenChange,
  ...rest
}: SplitButtonProps): ReactElement {
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  const open = isOpen ?? ownOpen;

  return (
    <ButtonGroup {...rest} data-slot="split-button">
      <Button
        variant={variant}
        {...omitUndefined({ size, isDisabled, isLoading, onPress, startIcon })}
      >
        {children}
      </Button>
      <Menu
        sections={sections}
        placement={placement}
        align={align}
        {...omitUndefined({ isOpen, defaultOpen, onAction })}
        onOpenChange={(next) => {
          setOwnOpen(next);
          onOpenChange?.(next);
        }}
      >
        <IconButton
          label={menuLabel}
          variant={variant}
          icon={<Icon name="chevron-down" className={cn(CARET_MOTION, open && "rotate-180")} />}
          isDisabled={isDisabled === true || isLoading === true}
          {...omitUndefined({ size })}
        />
      </Menu>
    </ButtonGroup>
  );
}
