/**
 * Stackra file contract:
 * Purpose: the native `Popover` on HeroUI Native's Popover: one component that takes a trigger and the content, and
 *          draws HeroUI Native's root, trigger, portal, overlay, content, arrow and title. It maps the shared contract
 *          (`defaultOpen` to `isDefaultOpen`, `placement` to a physical side by the screen's direction,
 *          `isDismissable` to the overlay's `closeOnPress`) and passes every other content prop through.
 * Boundary: no styling of its own; plain text children are wrapped in the kit's `Text`. `isKeyboardDismissDisabled`
 *           is accepted and unread: native has no Escape key (ADR 0312). Needs the native DesignSystemProvider for the
 *           direction.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native on native).
 */
import { Popover as HeroPopover, type PopoverContentProps } from "heroui-native";
import type { ReactElement } from "react";

import type { PopoverContractProps } from "#contracts/types/popover-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { physicalSideOf } from "#core/functions/physical-side-of.function";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { Text } from "#native/text/text";

/** HeroUI Native's content props for the floating presentation: the bottom sheet one is not offered. */
type HeroPopoverContentProps = Extract<PopoverContentProps, { presentation: "popover" }>;

/**
 * Props of the native Popover: the shared contract plus HeroUI Native's own popover content props, passed through.
 * HeroUI's `presentation` is fixed to the floating form.
 */
export type PopoverProps = PopoverContractProps &
  Omit<HeroPopoverContentProps, keyof PopoverContractProps | "presentation">;

/** The border HeroUI Native asks for on the content when an arrow is drawn, so the arrow meets the edge. */
const ARROW_BORDER = "border border-border";

/**
 * Rich content anchored to a trigger: opens on press, closes on a press outside or from a control inside, and keeps
 * its side by reading direction. Must sit inside the native `DesignSystemProvider`.
 */
export function Popover({
  trigger,
  children,
  title,
  hasArrow,
  placement = "bottom",
  align = "center",
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable = true,
  isKeyboardDismissDisabled: _isKeyboardDismissDisabled,
  className,
  ...rest
}: PopoverProps): ReactElement {
  const { direction } = useDesignSystem();
  return (
    <HeroPopover {...omitUndefined({ isOpen, isDefaultOpen: defaultOpen, onOpenChange })}>
      <HeroPopover.Trigger asChild>{trigger}</HeroPopover.Trigger>
      <HeroPopover.Portal>
        <HeroPopover.Overlay closeOnPress={isDismissable} />
        <HeroPopover.Content
          {...rest}
          presentation="popover"
          placement={physicalSideOf(placement, direction)}
          align={align}
          className={[hasArrow ? ARROW_BORDER : "", className].filter(Boolean).join(" ")}
        >
          {hasArrow ? <HeroPopover.Arrow /> : null}
          {title === undefined ? null : <HeroPopover.Title>{title}</HeroPopover.Title>}
          {typeof children === "string" ? <Text>{children}</Text> : children}
        </HeroPopover.Content>
      </HeroPopover.Portal>
    </HeroPopover>
  );
}
