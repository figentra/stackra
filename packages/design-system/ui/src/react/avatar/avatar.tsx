/**
 * Stackra file contract:
 * Purpose: the web `Avatar` on HeroUI v3's Avatar: draws the image, or else the fallback, the initials of `name` or a
 *          Lucide person icon at the Icon group's size; `tone` to `color` (default `default`), `square` to one radius
 *          class, decorative unless `label` names it as one image. Every other HeroUI root prop passes through.
 * Boundary: no styling of its own beyond the square class; the look is HeroUI's, themed by `@stackra/tokens`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI v3 on web); ADR 0303 (decision 7); ADR 0304; owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Avatar as HeroAvatar, cn } from "@heroui/react";
import { LucideProvider } from "lucide-react";
import { useLocale } from "react-aria-components";

import { AVATAR_SQUARE_CLASS_NAME } from "#core/constants/avatar-square-class-name.constant";
import { ICON_SIZES } from "#core/constants/icon-sizes.constant";
import { initialsOf } from "#core/functions/initials-of.function";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Icon } from "#react/icon/icon";
import type { AvatarProps } from "#react/avatar/avatar.props";

/**
 * A person's or organisation's picture, or the initials of its name when there is none. The picture is hidden from
 * assistive technology unless it has a `label`, because the name usually sits beside it in text.
 */
export function Avatar({
  name,
  src,
  label,
  size,
  tone = "default",
  variant,
  shape,
  fallback,
  className,
  ...rest
}: AvatarProps): ReactElement {
  const { locale } = useLocale();
  const initials = name ? initialsOf(name, locale) : "";
  const content =
    fallback ?? (initials === "" ? <Icon name="user-round" size={size ?? "md"} /> : initials);
  // `rounded-full` is explicit: HeroUI's own `rounded-3xl` is 12px on our small `--radius`, which is a rounded square.
  // The image is `alt=""` because a `role="img"` root already carries the name and its children are presentational.
  const accessibility = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };

  return (
    <HeroAvatar
      {...rest}
      {...accessibility}
      {...omitUndefined({ size, variant })}
      color={tone}
      className={
        cn(
          shape === "square" ? AVATAR_SQUARE_CLASS_NAME : "rounded-[var(--radius-pill)]",
          className,
        ) ?? ""
      }
    >
      {src ? <HeroAvatar.Image src={src} alt="" /> : null}
      <HeroAvatar.Fallback>
        <LucideProvider size={ICON_SIZES[size ?? "md"]}>{content}</LucideProvider>
      </HeroAvatar.Fallback>
    </HeroAvatar>
  );
}
