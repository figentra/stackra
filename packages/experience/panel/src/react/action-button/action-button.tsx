/**
 * Stackra file contract:
 * Purpose: `ActionButton`, the panel's server-driven action button: `@stackra/ui`'s `Button` with the spec's look, which
 *          runs its action through the action runner (the spec's confirmation in place of the declared one), or the
 *          host's handler, or follows its link; hidden without its permission or while its record predicate is not true;
 *          its description or disabled reason as a tooltip and as its accessible description.
 * Boundary: composition of @stackra/ui's `Button`, `Link`, `Tooltip` and `VisuallyHidden` and the panel's own runner and
 *           permission check. Needs a `PanelShell` (or a `ContainerProvider` and a `ConfirmationProvider`) above it when it
 *           runs an action. Hiding is a convenience: the server still checks every run. The danger tone draws the
 *           `danger` variant unless a variant is given.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 3 and 4); ADR 0139 (confirmation); ADR 0508 (shortcuts); ADR 0504; ADR 0165 (UI
 *                     through @stackra/ui); the SDUI catalogue case `actionButton` (STA-1981).
 */
import { useTranslation } from "@stackra/i18n/react";
import { Button, Link, Tooltip, VisuallyHidden } from "@stackra/ui/react";
import { useId, useState, type ReactElement } from "react";

import { shownWhen } from "#core/functions/shown-when.function";
import { specText } from "#core/functions/spec-text.function";
import type { ActionButtonProps } from "#react/action-button/action-button.props";
import { useActionRunner } from "#react/action-runner/use-action-runner";
import { useCan } from "#react/action-runner/use-can";

/**
 * One action button.
 *
 * @example
 * <ActionButton action={ArchiveProductAction} input={{ productId }} startIcon="archive" confirm={{ title: labels.ask }}>
 *   {labels.archive}
 * </ActionButton>
 */
export function ActionButton({
  children,
  action,
  input,
  onPress,
  record,
  onRun,
  label,
  variant,
  tone,
  isDisabled,
  isLoading,
  disabledReason,
  description,
  href,
  permission,
  confirm,
  visibleWhen,
  startIcon,
  endIcon,
  ...look
}: ActionButtonProps): ReactElement | null {
  const run = useActionRunner();
  const can = useCan();
  const { t } = useTranslation();
  const tipId = useId();
  const [isBusy, setBusy] = useState(false);
  if (!can(permission) || !shownWhen(visibleWhen, record)) return null;
  const name = label === undefined ? undefined : specText(label, t);
  if (href !== undefined)
    return (
      <Link href={href} label={name} tone={tone === "danger" ? "danger" : undefined}>
        {children}
      </Link>
    );
  const press = async () => {
    setBusy(true);
    try {
      if (onPress !== undefined) await onPress();
      else if (action !== undefined) {
        // Run first: `onRun?.(await run(...))` would skip the run itself when the host passes no `onRun`.
        const result =
          confirm === undefined
            ? await run(action, (input ?? {}) as never)
            : await run(action, (input ?? {}) as never, { confirm });
        onRun?.(result);
      }
    } finally {
      setBusy(false);
    }
  };
  const tipText = isDisabled === true ? disabledReason : description;
  const tip = tipText === undefined ? undefined : specText(tipText, t);
  const button = (
    <Button
      {...look}
      {...(startIcon === undefined ? {} : { startIcon })}
      {...(endIcon === undefined ? {} : { endIcon })}
      {...(variant === undefined && tone !== "danger" ? {} : { variant: variant ?? "danger" })}
      label={name}
      {...(isDisabled === undefined ? {} : { isDisabled })}
      isLoading={isLoading === true || isBusy}
      {...(tip === undefined ? {} : { "aria-describedby": tipId })}
      onPress={() => void press()}
    >
      {children}
    </Button>
  );
  if (tip === undefined) return button;
  // A disabled button leaves the tab order, so its reason is also its description for assistive technology.
  return (
    <>
      <Tooltip content={tip}>{button}</Tooltip>
      <VisuallyHidden id={tipId}>{tip}</VisuallyHidden>
    </>
  );
}
