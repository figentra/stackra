/**
 * Stackra file contract:
 * Purpose: the inside of a web list row: the start icon, the title and description, the end content and the chevron.
 *          `ListItem` draws it in a plain row or a button, and `List` draws it inside a HeroUI list box item, so one
 *          layout serves both.
 * Boundary: internal, not exported from the `./react` entry. It owns no element that takes input; the title and the
 *           description are React Aria `Text` slots, so inside a list box item they name and describe the option and
 *           anywhere else they are plain spans. The colours are theme utilities, never fixed values.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 7 and 10); ADR 0313 (text slots); ADR 0060 (RTL).
 */
import { Text } from "react-aria-components";

import type {
  ListItemContractProps,
  ListItemData,
} from "#contracts/types/list-item-contract-props.type";
import { Icon } from "#react/icon/icon";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The text a row is typed ahead by and named with when no `label` is given: the title when it is text, else the id. */
export function textValueOf(item: ListItemData): string {
  if (item.label !== undefined) return item.label;
  return typeof item.title === "string" ? item.title : item.id;
}

/** Props of {@link ListItemContent}: the row's slots. */
type ListItemContentProps = Pick<
  ListItemContractProps,
  "title" | "description" | "startIcon" | "endContent" | "hasChevron"
>;

/** Draws a row's slots in reading order: start icon, text, end content, chevron. */
export function ListItemContent({
  title,
  description,
  startIcon,
  endContent,
  hasChevron,
}: ListItemContentProps) {
  return (
    <>
      {startIcon === undefined ? null : (
        <span className="flex shrink-0 items-center text-muted">
          <SlotIcon icon={startIcon} />
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-0.5 text-start">
        <Text slot="label" className="text-sm font-medium text-foreground">
          {title}
        </Text>
        {description === undefined || description === null ? null : (
          <Text slot="description" className="text-xs text-muted">
            {description}
          </Text>
        )}
      </span>
      {endContent === undefined || endContent === null ? null : (
        <span className="flex shrink-0 items-center text-sm text-muted">{endContent}</span>
      )}
      {hasChevron === true ? (
        <span className="flex shrink-0 items-center text-muted">
          <Icon name="chevron-right" size="sm" isMirroredInRtl />
        </span>
      ) : null}
    </>
  );
}
