/**
 * Stackra file contract:
 * Purpose: the web `ItemCard`: one row-like card (an icon in a soft tile, the title, a muted line, an end slot); with
 *          `onPress` it is a button with a chevron that points to the inline end.
 * Boundary: a pressable card is React Aria's Button (Enter and Space press it); a plain one is a `div`. Inside an
 *           ItemCardGroup it drops its own border and joins the group's surface.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060; WCAG 2.2
 *          SC 2.1.1, 2.5.8, 4.1.2.
 */
import { cn } from "@heroui/react";
import { use, type ReactElement } from "react";
import { Button } from "react-aria-components";

import { Icon } from "#react/icon/icon";
import { ItemCardGroupContext } from "#react/item-card/item-card-group-context";
import type { ItemCardProps } from "#react/item-card/item-card.props";

/** Draws one item as a card with its title and details. */
export function ItemCard({
  title,
  description,
  icon,
  end,
  onPress,
  isDisabled,
  className,
}: ItemCardProps): ReactElement {
  const isGrouped = use(ItemCardGroupContext);
  const body = (
    <>
      {icon ? (
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-container)] bg-default text-foreground"
        >
          <Icon name={icon} size="sm" />
        </span>
      ) : null}
      <span className="grid min-w-0 flex-1 gap-0.5 text-start">
        <span className="truncate font-medium text-foreground">{title}</span>
        {description ? <span className="text-sm text-muted">{description}</span> : null}
      </span>
      {end ? <span className="shrink-0 text-sm text-muted">{end}</span> : null}
      {onPress ? <Icon name="chevron-right" size="sm" className="shrink-0 text-muted" /> : null}
    </>
  );
  const look =
    cn(
      "flex min-h-14 w-full items-center gap-3 px-4 py-3",
      isGrouped ? "" : "rounded-[var(--radius-container)] border border-border bg-surface",
      className,
    ) ?? "";
  if (!onPress) return <div className={cn(look, isDisabled && "opacity-50") ?? ""}>{body}</div>;
  return (
    <Button
      onPress={onPress}
      isDisabled={isDisabled ?? false}
      className={({ isHovered, isFocusVisible, isPressed }) =>
        cn(
          look,
          "cursor-pointer outline-none transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50",
          (isHovered || isPressed) && "bg-surface-hover",
          isFocusVisible && "outline-2 -outline-offset-2 outline-focus",
        ) ?? ""
      }
    >
      {body}
    </Button>
  );
}
