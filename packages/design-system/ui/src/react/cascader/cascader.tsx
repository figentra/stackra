/**
 * Stackra file contract:
 * Purpose: the web `Cascader`: a labelled field that picks a path through a hierarchy (country, region, city). Its
 *          trigger, in HeroUI's select look, shows the chosen path ("Saudi Arabia / Riyadh / Al Olaya") and opens a
 *          popover of side-by-side columns, one list box per level: choosing a row with rows under it opens the next
 *          column, choosing a leaf sets the path and closes. Right (Left in right-to-left) on a row with rows under it
 *          opens them and moves into the next column; Left moves back. Rows marked `hasChildren` load through
 *          `onLoadChildren` the first time they are opened, with "Loading…" in their column meanwhile.
 * Boundary: React Aria owns the trigger, the popover's focus and dismissal and each list box's keys; the columns lay
 *           out from the inline start, so the path reads and opens the reading way. Each name of the path is isolated
 *           (`bdi`) and the separator is a neutral slash, so a mixed Arabic and Latin path keeps its order without
 *           reversing any text. The value is the path's ids; a form receives them under `name` from hidden inputs.
 *           shortcut: a chosen path below rows that are not loaded yet shows only its loaded names; load them before
 *           setting such a value when the full path must show.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0060 (right-to-left); STA-1371 (wave D,
 *          owner approval 2026-10-30); WCAG 2.2 SC 1.3.1, 2.1.1, 4.1.2.
 */
import {
  cn,
  Description,
  Label,
  ListBox,
  Popover as HeroPopover,
  selectVariants,
} from "@heroui/react";
import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { Button as AriaButton, useLocale, VisuallyHidden } from "react-aria-components";

import type { TreeViewNode } from "#contracts/types/tree-view-node.type";
import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { cascadeColumnsOf } from "#core/functions/cascade-columns-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { CascaderProps } from "#react/cascader/cascader.props";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The cascader's words. */
const K = OVERLAY_SELECTION_KEYS.ui.cascader;

/** Nothing chosen yet. */
const NONE: readonly string[] = [];

/** True when a row opens a further column. */
const hasRows = (node: TreeViewNode) =>
  (node.children?.length ?? 0) > 0 || node.hasChildren === true;

/** A field that picks a path through a hierarchy. */
export function Cascader({
  items,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled,
  isRequired,
  placeholder,
  onLoadChildren,
  value,
  defaultValue,
  onChange,
  name,
  variant = "primary",
  className,
  "aria-label": ariaLabel,
}: CascaderProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const isRtl = useLocale().direction === "rtl";
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const chosen = value ?? own;
  const [isOpen, setOpen] = useState(false);
  // The path being browsed in the open popover; it starts at the chosen one.
  const [active, setActive] = useState(chosen);
  const [loaded, setLoaded] = useState<ReadonlyMap<string, readonly TreeViewNode[]>>(new Map());
  const [loading, setLoading] = useState<string | null>(null);
  const [focusLevel, setFocusLevel] = useState<number | null>(null);
  const columnsRef = useRef<(HTMLDivElement | null)[]>([]);
  const slots = selectVariants({ fullWidth: true, variant });
  const fieldName = typeof label === "string" ? label : (ariaLabel ?? "");
  const shown = cascadeColumnsOf(items, chosen, loaded).nodes;
  const { columns, nodes } = cascadeColumnsOf(items, active, loaded);

  useEffect(() => {
    if (focusLevel === null) return;
    // React Aria renders a list box's options a pass after the list box, so the column may still be empty.
    let frame = 0;
    let tries = 0;
    const attempt = () => {
      const column = columnsRef.current[focusLevel];
      const target =
        column?.querySelector<HTMLElement>('[role="option"][aria-selected="true"]') ??
        column?.querySelector<HTMLElement>('[role="option"]');
      if (target) {
        target.focus();
        setFocusLevel(null);
      } else if (tries++ < 10) frame = requestAnimationFrame(attempt);
    };
    attempt();
    return () => cancelAnimationFrame(frame);
  }, [focusLevel]);

  const choose = (level: number, node: TreeViewNode) => {
    const path = [...active.slice(0, level), node.id];
    if (!hasRows(node)) {
      if (value === undefined) setOwn(path);
      onChange?.(path);
      setOpen(false);
      return;
    }
    setActive(path);
    if (node.children === undefined && !loaded.has(node.id) && onLoadChildren) {
      setLoading(node.id);
      onLoadChildren(node.id).then(
        (rows) => {
          setLoaded((current) => new Map(current).set(node.id, rows));
          setLoading(null);
        },
        () => setLoading(null),
      );
    }
  };

  const onColumnKey = (level: number) => (event: KeyboardEvent<HTMLDivElement>) => {
    const forward = isRtl ? "ArrowLeft" : "ArrowRight";
    const backward = isRtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === backward && level > 0) {
      event.preventDefault();
      event.stopPropagation();
      setFocusLevel(level - 1);
      return;
    }
    if (event.key !== forward) return;
    const options = [...event.currentTarget.querySelectorAll('[role="option"]')];
    const node = columns[level]?.[options.indexOf(event.target as Element)];
    if (node === undefined || !hasRows(node) || node.isDisabled) return;
    event.preventDefault();
    event.stopPropagation();
    choose(level, node);
    setFocusLevel(level + 1);
  };

  return (
    <div
      data-slot="cascader"
      className={cn(slots.base(), "flex flex-col gap-1", className)}
      {...(isInvalid ? { "data-invalid": true } : {})}
    >
      {label == null ? null : (
        <Label id={`${id}-label`} {...omitUndefined({ isRequired, isInvalid })}>
          {label}
        </Label>
      )}
      <HeroPopover
        isOpen={isOpen}
        onOpenChange={(next) => {
          if (next) setActive(chosen);
          setOpen(next);
        }}
      >
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
              shown.length === 0 && "text-field-placeholder",
            )}
          >
            {shown.length === 0
              ? (placeholder ?? t(K.placeholder))
              : shown.map((node, index) => (
                  <Fragment key={node.id}>
                    {index > 0 ? (
                      <>
                        <VisuallyHidden>, </VisuallyHidden>
                        <span aria-hidden className="mx-1 text-muted">
                          /
                        </span>
                      </>
                    ) : null}
                    <bdi>{node.label}</bdi>
                  </Fragment>
                ))}
          </span>
          <span aria-hidden className={slots.indicator()} data-open={isOpen}>
            <Icon name="chevron-down" size="sm" />
          </span>
        </AriaButton>
        <HeroPopover.Content placement="bottom start" className="max-w-[calc(100vw-2rem)]">
          <HeroPopover.Dialog aria-label={fieldName} className="flex overflow-x-auto p-0">
            {columns.map((rows, level) => (
              // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the keys come from the list box inside; this only adds Left and Right between columns
              <div
                key={nodes[level - 1]?.id ?? "top"}
                ref={(element) => {
                  columnsRef.current[level] = element;
                }}
                onKeyDownCapture={onColumnKey(level)}
                className="max-h-72 w-56 shrink-0 overflow-y-auto border-e border-separator p-1 last:border-e-0"
              >
                <ListBox
                  aria-label={level === 0 ? fieldName : (nodes[level - 1]?.label ?? fieldName)}
                  selectionMode="single"
                  selectedKeys={active[level] === undefined ? [] : [active[level]]}
                  onSelectionChange={(keys) => {
                    const key = keys === "all" ? undefined : [...keys][0];
                    const node = rows.find((row) => row.id === key);
                    if (node) choose(level, node);
                  }}
                >
                  {rows.map((row) => (
                    <ListBox.Item
                      key={row.id}
                      id={row.id}
                      textValue={row.label}
                      isDisabled={row.isDisabled ?? false}
                      className="data-[selected]:bg-default data-[selected]:font-medium"
                    >
                      <SlotIcon icon={row.icon} />
                      <span className="min-w-0 flex-1 truncate">{row.label}</span>
                      {hasRows(row) ? <Icon name="chevron-right" size="sm" tone="muted" /> : null}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </div>
            ))}
            {loading === null ? null : (
              <p role="status" className="w-56 shrink-0 p-3 text-sm text-muted">
                {t(K.loading)}
              </p>
            )}
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
