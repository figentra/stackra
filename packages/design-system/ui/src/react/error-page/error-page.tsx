/**
 * Stackra file contract:
 * Purpose: the web `ErrorPage`: a full-page `ErrorState` preset for 403, 404, 500 and offline, with the preset's
 *          icon, title and description from the `ui` catalogue (the caller's words win) and a retry button that
 *          stays pending while `onRetry`'s promise runs.
 * Boundary: composition only: ErrorState draws, announces and shows details; this picks the words, the icon and the
 *           kind. The retry spinner is HeroUI's, which follows `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0313 (decisions 1 and 6); GAPS.md row 31 (owner decision
 *          2026-10-28); WCAG 2.2 SC 4.1.3.
 */
import type { ReactElement } from "react";
import { IconRegistryProvider } from "@stackra/icons/react";

import { ERROR_PAGE_KEYS } from "#core/constants/error-page-keys.constant";
import { ERROR_PAGE_PRESET } from "#core/constants/error-page-preset.constant";
import { Button } from "#react/button/button";
import { ERROR_PAGE_ICONS } from "#react/error-page/error-page-icons.constant";
import { ErrorState } from "#react/error-state/error-state";
import { usePendingPress } from "#react/hooks/use-pending-press";
import { useUiText } from "#react/hooks/use-ui-text";
import { Icon } from "#react/icon/icon";
import type { ErrorPageProps } from "#react/error-page/error-page.props";

/** The page's words. */
const K = ERROR_PAGE_KEYS.ui.error_page;

/** A 403, 404, 500 or offline page with ready-made words and a retry that stays pending until it settles. */
export function ErrorPage({
  preset,
  title,
  description,
  icon,
  actions,
  onRetry,
  retryLabel,
  ...rest
}: ErrorPageProps): ReactElement {
  const t = useUiText();
  const { kind, icon: presetIcon, group } = ERROR_PAGE_PRESET[preset];
  const { isPending, press } = usePendingPress(onRetry);
  // The kind already draws the 403 and 404 icons; the other two are this page's own registry.
  const drawn =
    icon ??
    (presetIcon === "server-crash" || presetIcon === "wifi-off" ? (
      <IconRegistryProvider registry={ERROR_PAGE_ICONS}>
        <Icon name={presetIcon} size="lg" tone="muted" />
      </IconRegistryProvider>
    ) : undefined);
  return (
    <ErrorState
      {...rest}
      data-preset={preset}
      kind={kind}
      title={title ?? t(K[group].title)}
      description={description === undefined ? t(K[group].description) : description}
      {...(drawn === undefined ? {} : { icon: drawn })}
      actions={
        onRetry === undefined && actions == null ? undefined : (
          <>
            {onRetry === undefined ? null : (
              <Button isLoading={isPending} onPress={() => void press()}>
                {retryLabel ?? t(K.retry)}
              </Button>
            )}
            {actions}
          </>
        )
      }
    />
  );
}
