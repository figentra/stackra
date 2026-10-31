/**
 * Stackra file contract:
 * Purpose: the web `TreeSelect`: a labelled field whose options are a tree. Its trigger, drawn in HeroUI's select
 *          look, shows the chosen rows' names (or "3 chosen") and opens a popover holding a TreeView; `single` closes
 *          on a choice, `multiple` ticks rows (a tick carries down to the rows under it unless
 *          `isSelectionPropagated` is false) and stays open. Rows can load lazily through `onLoadChildren`.
 * Boundary: React Aria owns the trigger, the popover's focus and dismissal and the tree's keyboard; the trigger is
 *           named by the label and its value. The value is the chosen ids in list order; a form receives them under
 *           `name` from hidden inputs. Logical properties only, so the field mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0165 (React Aria and HeroUI v3 on
 *          web); ADR 0060 (right-to-left); STA-1371 (wave C, owner request 2026-10-29); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
import { cn, Description, Label, Popover as HeroPopover, selectVariants } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";
import { Button as AriaButton, useLocale } from "react-aria-components";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { INPUT_KEYS } from "#core/constants/input-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { TreeSelectProps } from "#react/tree-select/tree-select.props";
import { TreeView } from "#react/tree-view/tree-view";

/** Nothing chosen yet. */
const NONE: readonly string[] = [];

/** The names of the rows, by id, through the whole tree. */
const namesOf = (nodes: readonly TreeViewNode[], into = new Map<string, string>()) => {
  for (const node of nodes) {
    into.set(node.id, node.label);
    namesOf(node.children ?? [], into);
  }
  return into;
};

/** A field that picks one row or several from a tree. */
export function TreeSelect({
  items,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isRequired,
  placeholder,
  selectionMode = "single",
  isSelectionPropagated = true,
  defaultExpandedKeys,
  onLoadChildren,
  value,
  defaultValue,
  onChange,
  name,
  variant = "primary",
  className,
  "aria-label": ariaLabel,
}: TreeSelectProps): ReactElement {
  const t = useUiText();
  const format = useNumberFormat();
  const { locale } = useLocale();
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const [isOpen, setOpen] = useState(false);
  const chosen = value ?? own;
  const names = namesOf(items);
  const slots = selectVariants({ fullWidth: true, variant });
  const shown =
    chosen.length === 0
      ? null
      : chosen.length <= 2
        ? new Intl.ListFormat(locale, { type: "unit", style: "short" }).format(
            chosen.map((key) => names.get(key) ?? key),
          )
        : t(INPUT_KEYS.ui.tree_select.count, { count: format(chosen.length) });
  const fieldName = typeof label === "string" ? label : (ariaLabel ?? "");

  const choose = (keys: readonly string[]) => {
    if (value === undefined) setOwn(keys);
    onChange?.(keys);
    if (selectionMode === "single" && keys.length > 0) setOpen(false);
  };

  return (
    <div
      data-slot="tree-select"
      className={cn(slots.base(), "flex flex-col gap-1", className)}
      {...(isInvalid ? { "data-invalid": true } : {})}
    >
      {label == null ? null : (
        <Label id={`${id}-label`} {...omitUndefined({ isRequired, isInvalid })}>
          {label}
        </Label>
      )}
      <HeroPopover isOpen={isOpen} onOpenChange={setOpen}>
        <AriaButton
          isDisabled={isDisabled ?? false}
          {...omitUndefined({
            "aria-labelledby": label == null ? undefined : `${id}-label ${id}-value`,
            "aria-label": label == null ? ariaLabel : undefined,
            "aria-describedby":
              [description == null ? "" : `${id}-description`, isInvalid ? `${id}-error` : ""]
                .filter(Boolean)
                .join(" ") || undefined,
            "aria-invalid": isInvalid || undefined,
          })}
          className={
            cn(
              slots.trigger(),
              "w-full text-start",
              isInvalid && "border-danger",
              isDisabled && "opacity-(--disabled-opacity)",
            ) ?? ""
          }
        >
          <span
            id={`${id}-value`}
            className={cn(
              slots.value(),
              "block truncate",
              shown === null && "text-field-placeholder",
            )}
          >
            {shown ?? placeholder ?? t(INPUT_KEYS.ui.tree_select.placeholder)}
          </span>
          <span aria-hidden className={slots.indicator()} data-open={isOpen}>
            <Icon name="chevron-down" size="sm" />
          </span>
        </AriaButton>
        <HeroPopover.Content placement="bottom start" className="min-w-(--trigger-width)">
          <HeroPopover.Dialog aria-label={fieldName} className="max-h-80 overflow-auto p-1">
            <TreeView
              items={items}
              label={fieldName}
              selectionMode={selectionMode}
              isSelectionPropagated={isSelectionPropagated}
              selectedKeys={chosen}
              onSelectionChange={choose}
              {...omitUndefined({ defaultExpandedKeys, onLoadChildren })}
            />
          </HeroPopover.Dialog>
        </HeroPopover.Content>
      </HeroPopover>
      {description == null ? null : (
        <Description id={`${id}-description`}>{description}</Description>
      )}
      {isInvalid && errorMessage ? (
        <span id={`${id}-error`} className="text-xs text-danger">
          {errorMessage}
        </span>
      ) : null}
      {name ? chosen.map((key) => <input key={key} type="hidden" name={name} value={key} />) : null}
    </div>
  );
}
