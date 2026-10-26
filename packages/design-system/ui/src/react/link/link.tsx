/**
 * Stackra file contract:
 * Purpose: the web `Link` on HeroUI v3: a thin wrapper that maps the shared contract (tone, underline, external,
 *          label) onto HeroUI's `Link` and passes every other HeroUI prop through; client navigation comes from the
 *          nearest React Aria `RouterProvider`, never from an import.
 * Boundary: renders HeroUI's Link; no router import, no styles beyond the tone and underline utilities. The external
 *          mark is HeroUI's own glyph, which it sizes in `em` with the text.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decisions 5 and 7); ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350.
 */
import { Link as HeroLink } from "@heroui/react";
import { composeRenderProps } from "react-aria-components";

import { TONE_CLASS_NAME } from "#core/constants/tone-class-name.constant";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import type { LinkProps } from "#react/link/link.props";

/**
 * A text link on HeroUI v3 that navigates through the nearest `RouterProvider`. An internal `href` is a client
 * navigation; an external link opens a new tab with the external mark and a spoken hint.
 */
export function Link({
  tone = "default",
  underline = "always",
  isExternal = false,
  href,
  onPress,
  isDisabled,
  label,
  externalLabel,
  className,
  target,
  rel,
  children,
  ...rest
}: LinkProps) {
  const t = useUiText();
  externalLabel ??= t(UI_KEYS.ui.link.opens_in_new_tab);
  // Written out in full: Tailwind finds `text-link` and `underline` here, and `default` has no entry in the map.
  const toneClass = tone === "default" ? "text-link" : TONE_CLASS_NAME[tone];
  const own = underline === "always" ? `${toneClass} underline` : toneClass;
  const accessibleName = label && isExternal ? `${label} (${externalLabel})` : label;

  return (
    <HeroLink
      {...rest}
      {...omitUndefined({
        // A disabled link is a span, which React Aria still hands the `href` attribute, so it is left off here.
        href: isDisabled ? undefined : href,
        onPress,
        isDisabled,
        target: target ?? (isExternal ? "_blank" : undefined),
        rel: rel ?? (isExternal ? "noopener noreferrer" : undefined),
        "aria-label": accessibleName || undefined,
      })}
      className={composeRenderProps(className, (caller) => [own, caller].filter(Boolean).join(" "))}
    >
      {children}
      {isExternal ? (
        <>
          <HeroLink.Icon aria-hidden="true" className="rtl:-scale-x-100" />
          {/* A space text node, not one inside the span: inline spans join without a separator in a name. */}
          {label ? null : (
            <>
              {" "}
              <span className="sr-only">{externalLabel}</span>
            </>
          )}
        </>
      ) : null}
    </HeroLink>
  );
}
