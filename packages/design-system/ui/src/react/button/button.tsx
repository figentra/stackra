/**
 * Stackra file contract:
 * Purpose: the web `Button` on HeroUI v3: maps the shared contract onto HeroUI's button (`isLoading` to `isPending`
 *          with a hidden current-colour spinner in the start slot, `isFullWidth` to `fullWidth`, `label` to
 *          `aria-label`) and passes every other HeroUI prop through unchanged.
 * Boundary: `shortcut` or `action` register the key with the nearest ShortcutProvider and draw the hint (ADR 0508);
 *          no styling of its own; the look is HeroUI's, themed by `@stackra/tokens`. An icon-only button is built
 *          through `IconButton`, whose type requires the accessible name, so `isIconOnly` is not a prop here.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract, HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers).
 */
import type { ReactElement } from "react";
import { Button as HeroButton, Spinner, cn } from "@heroui/react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { plainTextOf } from "#react/hooks/plain-text-of.function";
import { useActionShortcut } from "#react/hooks/use-action-shortcut";
import { SlotIcon } from "#react/slot-icon/slot-icon";
import type { ButtonProps } from "#react/button/button.props";

/**
 * A button on HeroUI v3. While `isLoading` the press is refused and focus stays on the button; the spinner replaces
 * the start icon and is hidden from assistive technology, so the accessible name stays the label and the pending
 * state is exposed only as `aria-disabled`.
 */
// shortcut: no spoken "loading" state (WCAG 4.1.3), owner decision O12 keeps the name unchanged; a `loadingLabel`
// prop arrives with @stackra/i18n, when the announcement can be translated.
export function Button({
  variant,
  className,
  size,
  isDisabled,
  onPress,
  isLoading,
  isFullWidth,
  startIcon,
  endIcon,
  label,
  children,
  shortcut,
  shortcutId,
  action,
  ...rest
}: ButtonProps): ReactElement {
  const press = onPress ?? action?.run;
  const text = children ?? action?.label;
  const keys = useActionShortcut({
    shortcut,
    shortcutId,
    action,
    label: label ?? plainTextOf(text),
    run: press,
    isDisabled: (isDisabled ?? false) || (isLoading ?? false),
    canInline: (rest as { isIconOnly?: boolean }).isIconOnly !== true,
  });
  return keys.wrap(
    <HeroButton
      {...rest}
      ref={keys.attach(rest.ref)}
      // A glass button is HeroUI's ghost drawn in the glass level by the material layer (`.button--glass`).
      {...omitUndefined({
        variant: variant === "glass" ? "ghost" : variant,
        size,
        isDisabled,
        onPress: press,
        className: cn(
          variant === "glass" && "button--glass",
          keys.badge !== null && "relative overflow-visible",
          className,
        ),
      })}
      isPending={isLoading ?? false}
      fullWidth={isFullWidth ?? false}
      {...(label ? { "aria-label": label } : {})}
    >
      {isLoading ? (
        <Spinner color="current" size="sm" aria-hidden="true" />
      ) : (
        <SlotIcon icon={startIcon ?? action?.icon} />
      )}
      {text}
      <SlotIcon icon={endIcon} />
      {keys.hint}
      {keys.badge}
    </HeroButton>,
  );
}
