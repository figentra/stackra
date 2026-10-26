/**
 * Stackra file contract:
 * Purpose: the web `ListItem`: one row of a list as a `li`, holding a start icon or avatar, a title and description,
 *          end content and a chevron. With `onPress` the row is HeroUI's ghost `Button`, so the focus ring, press
 *          feedback and disabled state are HeroUI's; without it the row is plain content.
 * Boundary: no styling layer of its own beyond the layout utilities that reset the button's fixed height and pill
 *           shape into a full-width row. It belongs inside a `ul`, which `List` provides. A row that selects is drawn by
 *           `List` as a list box item instead, never by this component.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (text slots); ADR 0165 (HeroUI v3 on
 *          web); WCAG 2.2 SC 2.5.8 (target size).
 */

import { Button } from "#react/button/button";
import { ListItemContent } from "#react/list/list-item-content";
import type { ListItemProps } from "#react/list/list-item.props";

/** The row's layout: full width, text at the reading start, tall enough to press. */
const ROW = "flex w-full min-h-11 items-center gap-3 px-4 py-3 text-start";

/**
 * A row of a list. Pressable when it has `onPress`, a button named by its title (or `label`); a disabled one is
 * refused and dimmed by the button; a plain row is never dimmed. Every other `li` prop, `className` and `ref` included, reaches the `li`.
 */
export function ListItem({
  title,
  description,
  startIcon,
  endContent,
  hasChevron,
  onPress,
  isDisabled,
  label,
  ...rest
}: ListItemProps) {
  const content = (
    <ListItemContent
      title={title}
      description={description}
      startIcon={startIcon}
      endContent={endContent}
      hasChevron={hasChevron}
    />
  );
  return (
    <li {...rest}>
      {onPress ? (
        <Button
          variant="ghost"
          // HeroUI's button is a fixed-height pill that never wraps; a row is neither, so `md:h-auto` also resets the
          // desktop height, which a plain `h-auto` leaves in place.
          className="h-auto min-h-11 w-full justify-start gap-3 whitespace-normal rounded-none px-4 py-3 text-start md:h-auto"
          onPress={onPress}
          {...(isDisabled === undefined ? {} : { isDisabled })}
          {...(label === undefined ? {} : { label })}
        >
          {content}
        </Button>
      ) : (
        <div className={ROW}>{content}</div>
      )}
    </li>
  );
}
