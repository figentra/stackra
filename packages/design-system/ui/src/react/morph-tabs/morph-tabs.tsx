/**
 * Stackra file contract:
 * Purpose: the web `MorphTabs`: React Aria's RadioGroup drawn as icon tabs, where the chosen tab grows into a
 *          soft accent pill that shows its words (a grid column easing from 0 to its width with the theme's `base`
 *          step); arrow keys move along the reading direction and every tab is named by its label.
 * Boundary: no panels, so it is a radio group (a segmented control), not a tablist whose `aria-controls` would point
 *           at nothing; the app shows what the chosen key stands for. The unchosen tabs keep their words for screen
 *           readers only. Reduced motion snaps the widths.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WAI-ARIA 1.2 radio group pattern.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { useState } from "react";
import { Radio, RadioGroup } from "react-aria-components";

import type { MorphTabsProps } from "#react/morph-tabs/morph-tabs.props";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** Icon tabs whose chosen tab grows into a pill with its words. */
export function MorphTabs({
  items,
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  label,
  isDisabled = false,
  className,
  ...rest
}: MorphTabsProps): ReactElement {
  const [ownKey, setOwnKey] = useState(defaultSelectedKey ?? items[0]?.id);
  const selected = selectedKey ?? ownKey;

  return (
    <div
      {...rest}
      data-slot="morph-tabs"
      className={cn("w-fit", isDisabled && "opacity-50", className) ?? ""}
    >
      <RadioGroup
        aria-label={label}
        orientation="horizontal"
        isDisabled={isDisabled}
        {...(selected === undefined ? {} : { value: selected })}
        onChange={(key) => {
          setOwnKey(key);
          onSelectionChange?.(key);
        }}
        className="flex items-center gap-1"
      >
        {items.map((item) => (
          <Radio
            key={item.id}
            value={item.id}
            aria-label={item.label}
            isDisabled={item.isDisabled === true}
            className={({ isSelected, isFocusVisible }) =>
              cn(
                "flex h-10 cursor-pointer items-center rounded-[var(--radius-pill)] px-3 outline-none transition-colors duration-[var(--duration-base)] motion-reduce:transition-none",
                isSelected ? "bg-accent-soft text-accent-soft-foreground" : "text-muted",
                isFocusVisible && "ring-2 ring-focus",
                item.isDisabled && "cursor-not-allowed opacity-50",
              ) ?? ""
            }
          >
            {({ isSelected }) => (
              <>
                <SlotIcon icon={item.icon} />
                <span
                  aria-hidden="true"
                  className={
                    cn(
                      "grid transition-[grid-template-columns,margin] duration-[var(--duration-base)] ease-out motion-reduce:transition-none",
                      isSelected ? "ms-1.5 grid-cols-[1fr]" : "grid-cols-[0fr]",
                    ) ?? ""
                  }
                >
                  <span className="overflow-hidden whitespace-nowrap font-medium">
                    {item.label}
                  </span>
                </span>
              </>
            )}
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
