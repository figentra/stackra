/**
 * Stackra file contract:
 * Purpose: the web `SegmentedControl`: React Aria's RadioGroup drawn as a track of exclusive choices on the control radius, with a raised thumb
 *          that slides to the chosen one (the theme's `base` step). Arrow keys move the choice and follow the reading
 *          direction; every choice is a radio named by its label.
 * Boundary: the thumb is placed from the chosen radio's own box (`offsetLeft`, physical, so it is right in either
 *           direction) and moves by CSS transition, none under reduced motion. Controlled by `selectedKey` or starting
 *           from `defaultSelectedKey` (else the first item).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WAI-ARIA 1.2 radio group pattern.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";

import type { Size } from "#contracts/enums/size.enum";
import type { SegmentedControlProps } from "#react/segmented-control/segmented-control.props";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The segment height and text of each size. */
const SIZE: Readonly<Record<Size, string>> = Object.freeze({
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3 text-sm",
  lg: "h-10 px-4 text-base",
});

/** A few exclusive choices with a sliding thumb (Day / Week / Month). */
export function SegmentedControl({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  label,
  isDisabled = false,
  size = "md",
  isFullWidth = false,
  className,
  ...rest
}: SegmentedControlProps): ReactElement {
  const [ownKey, setOwnKey] = useState(defaultSelectedKey ?? items[0]?.id);
  const selected = selectedKey ?? ownKey;
  const group = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const chosen = group.current?.querySelector<HTMLElement>(
      `[data-key="${CSS.escape(selected ?? "")}"]`,
    );
    setThumb(chosen ? { left: chosen.offsetLeft, width: chosen.offsetWidth } : null);
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- items, size and isFullWidth are not read: a change to any moves the chosen segment, so the thumb is measured again
  }, [selected, items, size, isFullWidth]);

  return (
    <RadioGroup
      {...rest}
      ref={group}
      aria-label={label}
      orientation="horizontal"
      isDisabled={isDisabled}
      {...(selected === undefined ? {} : { value: selected })}
      onChange={(key) => {
        setOwnKey(key);
        onSelectionChange?.(key);
      }}
      data-slot="segmented-control"
      // The control radius; the thumb and segments sit 0.25rem inside it, at the inner radius.
      style={{ borderRadius: "var(--radius-control)" }}
      className={
        cn(
          // The segmented-track role: the default fill in studio, an ultra-thin capsule in front (ADR 0320 as amended).
          "material-role-segmented-track relative flex p-1",
          isFullWidth ? "w-full" : "w-fit",
          isDisabled && "opacity-(--disabled-opacity)",
          className,
        ) ?? ""
      }
    >
      {thumb === null ? null : (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-0 bg-segment shadow-(--raised-shadow) transition-[transform,width] duration-(--duration-indicator) ease-(--ease-indicator) motion-reduce:transition-none"
          style={{
            width: thumb.width,
            transform: `translateX(${thumb.left}px)`,
            borderRadius: "var(--radius-control-inner)",
          }}
        />
      )}
      {items.map((item) => (
        <Radio
          key={item.id}
          value={item.id}
          data-key={item.id}
          style={{ borderRadius: "var(--radius-control-inner)" }}
          isDisabled={item.isDisabled === true}
          className={({ isSelected, isFocusVisible }) =>
            cn(
              "relative flex cursor-pointer items-center justify-center gap-1.5 font-medium outline-none",
              SIZE[size],
              isFullWidth && "flex-1",
              isSelected ? "text-foreground" : "text-muted",
              isFocusVisible && "ring-2 ring-focus",
              item.isDisabled && "cursor-not-allowed opacity-(--disabled-opacity)",
            ) ?? ""
          }
        >
          <SlotIcon icon={item.icon} />
          {item.label}
        </Radio>
      ))}
    </RadioGroup>
  );
}
