/**
 * Stackra file contract:
 * Purpose: the web `PropertyList`: the label and value rows of a detail page as a description list (`dl`, with a `dt`
 *          and a `dd` for each row), in one or two columns, an empty value shown as the list's `emptyValue`, and a copy
 *          button on a row that has a `copyLabel` and text to copy. The list writes the clipboard itself, then draws the
 *          button's icon as a check for two seconds and says the `copiedLabel` ("Copied" by default) once in a polite
 *          live region, so a copy is never silent (WCAG 4.1.3).
 * Boundary: built on the free Text and IconButton of this package, so it adds no styling layer: the classes are layout
 *           only (a grid and a gap), logical so right-to-left mirrors. HeroUI v3 has no description list, so this is the
 *           adapted form on free parts. A clipboard write that the browser refuses (no permission, an insecure page)
 *           is silent: nothing is copied, so nothing is announced and `onCopy` is not called.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 1 and 7); WCAG 2.2 SC 1.3.1,
 *          2.5.8 and 4.1.3.
 */
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

import type { PropertyListItem } from "#contracts/types/property-list-item.type";
import { copyTextOf } from "#core/functions/copy-text-of.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { Text } from "#react/text/text";
import type { TextProps } from "#react/text/text.props";
import type { PropertyListProps } from "#react/property-list/property-list.props";

/** The grid of each column count; two columns stack into one below the small breakpoint. */
const COLUMNS_CLASS_NAME = Object.freeze({
  1: "grid grid-cols-1 gap-4",
  2: "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2",
} as const satisfies Record<1 | 2, string>);

/** How long the check stays on a copy button after a copy, in milliseconds. */
const COPIED_MILLISECONDS = 2000;

/** True for a value with nothing to show: missing, empty or `false`; `0` is a value. */
const isEmpty = (value: ReactNode) => value == null || value === "" || value === false;

/** Draws Text as a `span`: it sits beside the copy button in a row, and a `dt` or `dd` is not a paragraph. */
const renderSpan: NonNullable<TextProps["render"]> = (domProps) => <span {...domProps} />;

/**
 * Label and value pairs. Pass `columns={2}` for two columns of rows on a wide screen, `emptyValue` for what an empty
 * value shows, and a `copyLabel` on a row to give it a copy button.
 */
export function PropertyList<TItem extends PropertyListItem = PropertyListItem>({
  items,
  columns = 1,
  emptyValue = "–",
  copiedLabel,
  onCopy,
  className,
  ...rest
}: PropertyListProps<TItem>): ReactElement {
  const t = useUiText();
  copiedLabel ??= t(UI_KEYS.ui.property_list.copied);
  const [copiedId, setCopiedId] = useState<string | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (item: TItem, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // reason: a refused write leaves nothing copied, so there is nothing to confirm; see the file header.
      return;
    }
    setCopiedId(item.id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiedId(undefined), COPIED_MILLISECONDS);
    onCopy?.(item, text);
  };

  return (
    <>
      <dl className={[COLUMNS_CLASS_NAME[columns], className].filter(Boolean).join(" ")} {...rest}>
        {items.map((item) => {
          const text = copyTextOf(item);
          return (
            <div key={item.id} data-slot="property-list-row" className="grid min-w-0 gap-1">
              <dt>
                <Text type="small" tone="muted" render={renderSpan}>
                  {item.label}
                </Text>
              </dt>
              <dd className="flex min-w-0 items-center gap-1">
                <span className="min-w-0 break-words">
                  {isEmpty(item.value) ? (
                    <Text tone="muted" render={renderSpan}>
                      {emptyValue}
                    </Text>
                  ) : typeof item.value === "string" || typeof item.value === "number" ? (
                    <Text render={renderSpan}>{item.value}</Text>
                  ) : (
                    item.value
                  )}
                </span>
                {text === undefined || item.copyLabel === undefined ? null : (
                  <IconButton
                    icon={copiedId === item.id ? "check" : "copy"}
                    label={item.copyLabel}
                    variant="ghost"
                    size="sm"
                    onPress={() => void copy(item, text)}
                  />
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <span role="status" className="sr-only">
        {copiedId === undefined ? "" : copiedLabel}
      </span>
    </>
  );
}
