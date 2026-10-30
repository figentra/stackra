/**
 * Stackra file contract:
 * Purpose: the web `AvatarGroup` on HeroUI v3's AvatarGroup: up to `max` Stackra Avatars stacked with a ring seam,
 *          then a "+N" count in the locale's digits that names the rest. Hovering or focusing inside the group fans the
 *          avatars apart. It is one named `group`; each avatar is an image named by its person.
 * Boundary: the fan-out is a CSS transition of HeroUI's `--avatar-group-overlap` (theme `fast` step); reduced motion
 *          fans out at once. The overlap follows the reading direction (HeroUI's logical margins).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); design-system gap inventory row 25.
 */
import type { ReactElement } from "react";
import { AvatarGroup as HeroAvatarGroup, cn } from "@heroui/react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Avatar } from "#react/avatar/avatar";
import { useUiText } from "#react/hooks/use-ui-text";
import type { AvatarGroupProps } from "#react/avatar-group/avatar-group.props";

/** Hover and focus turn the overlap negative, so the avatars part by a small gap; reduced motion drops the easing. */
const FAN_OUT =
  "[&>*]:transition-[margin] [&>*]:duration-150 [&>*]:ease-out motion-reduce:[&>*]:transition-none " +
  "hover:[--avatar-group-overlap:-0.25rem] focus-within:[--avatar-group-overlap:-0.25rem]";

/** Stacked people (assignees, staff on shift, viewers) with a count for those that do not fit. */
export function AvatarGroup({
  items,
  max = 4,
  label,
  size,
  tone,
  variant,
  shape,
  className,
  ...rest
}: AvatarGroupProps): ReactElement {
  const t = useUiText();
  const shown = items.slice(0, Math.max(0, max));
  const remaining = items.length - shown.length;

  return (
    <HeroAvatarGroup
      overlap="ring"
      {...rest}
      {...omitUndefined({ size, variant })}
      role="group"
      aria-label={label}
      className={cn(FAN_OUT, className) ?? ""}
    >
      {shown.map((item) => (
        <Avatar
          key={item.id}
          name={item.name}
          label={item.name}
          {...omitUndefined({ src: item.src, size, tone, variant, shape })}
        />
      ))}
      {remaining > 0 ? (
        // A Stackra Avatar, not HeroUI's count, so the count takes the same shape and tone as the people.
        <Avatar
          label={t(UI_KEYS.ui.avatar_group.more_label, { count: remaining })}
          fallback={t(UI_KEYS.ui.avatar_group.more, { count: remaining })}
          {...omitUndefined({ size, tone, variant, shape })}
        />
      ) : null}
    </HeroAvatarGroup>
  );
}
