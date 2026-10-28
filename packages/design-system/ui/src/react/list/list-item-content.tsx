/**
 * Stackra file contract:
 * Purpose: the inside of a web list row: the start icon, the title and description, the end content and the chevron.
 *          `ListItem` draws it in a plain row or a button, and `List` draws it inside a HeroUI list box item, so one
 *          layout serves both.
 * Boundary: internal, not exported from the `./react` entry. It owns no element that takes input; the title and the
 *           description are plain spans, not React Aria `Text` slots, which would name an option by its title alone and
 *           leave the description's visible text out of the name (WCAG 2.5.3). The colours are theme utilities, never
 *           fixed values.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 7 and 10); ADR 0313 (text slots); ADR 0060 (RTL).
 */
import type { ReactElement } from "react";
import type { ListItemContractProps } from "#contracts/types/list-item-contract-props.type";
import { Icon } from "#react/icon/icon";
import { SlotIcon } from "#react/slot-icon/slot-icon";

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
}: ListItemContentProps): ReactElement {
  return (
    <>
      {startIcon === undefined ? null : (
        <span className="flex shrink-0 items-center text-muted">
          <SlotIcon icon={startIcon} />
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-0.5 text-start">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description === undefined || description === null ? null : (
          <span className="text-xs text-muted">{description}</span>
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
