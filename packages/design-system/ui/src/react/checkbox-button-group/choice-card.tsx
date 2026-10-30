/**
 * Stackra file contract:
 * Purpose: `ChoiceCard`, the inside of one card of the web RadioButtonGroup and CheckboxButtonGroup: an optional icon,
 *          the title, a muted line under it and the round or square mark at the inline end.
 * Boundary: internal; drawing only. The card's state comes from React Aria's render props.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0060 (right-to-left).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { ChoiceItem } from "#contracts/types/choice-item.type";
import { Icon } from "#react/icon/icon";

/** One card's contents. */
export function ChoiceCard({
  item,
  isSelected,
  mark,
}: {
  readonly item: ChoiceItem;
  readonly isSelected: boolean;
  readonly mark: "radio" | "checkbox";
}): ReactElement {
  return (
    <>
      {item.icon ? (
        <Icon name={item.icon} className={isSelected ? "text-accent" : "text-muted"} />
      ) : null}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="font-medium text-foreground">{item.label}</span>
        {item.description ? <span className="text-sm text-muted">{item.description}</span> : null}
      </span>
      <span
        aria-hidden
        className={
          cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center border-2",
            mark === "radio" ? "rounded-full" : "rounded-md",
            isSelected ? "border-accent bg-accent text-accent-foreground" : "border-field-border",
          ) ?? ""
        }
      >
        {isSelected ? (
          mark === "radio" ? (
            <span className="size-2 rounded-full bg-accent-foreground" />
          ) : (
            <Icon name="check" size="sm" />
          )
        ) : null}
      </span>
    </>
  );
}
