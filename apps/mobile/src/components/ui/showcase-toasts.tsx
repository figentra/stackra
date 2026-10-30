/**
 * Stackra file contract:
 * Purpose: `ShowcaseToasts`, the app's one `ToastProvider`, its dismiss button named in the picked language, so the
 *          toast demos' `toast()` calls have a stack to fill however many demo pages are mounted. It holds the stack's
 *          look and place along the edge, which the toast "styles" demo picks through `ShowcaseToastStyleContext`.
 * Boundary: mounts the provider only; sits inside the app's `I18nProvider` (for the words) and the `DesignSystemProvider`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3).
 */
import type { ToastAlign, ToastVariant } from "@stackra/ui/contracts";
import { ToastProvider, useCatalogueText } from "@stackra/ui/native";
import { type ReactElement, useMemo, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOAST_DEMO_KEYS } from "#src/demos/free/toast/toast-demo-keys.constant";

import { ShowcaseToastStyleContext } from "./showcase-toast-style-context";
import type { ShowcaseToastsProps } from "./showcase-toasts.props";

/** One toast stack for the whole app: a provider per demo would fight over the single `toast()` bridge. */
export function ShowcaseToasts({ children }: ShowcaseToastsProps): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  const [variant, setVariant] = useState<ToastVariant>("alert");
  const [align, setAlign] = useState<ToastAlign>("full");
  const style = useMemo(() => ({ variant, align, setVariant, setAlign }), [variant, align]);
  return (
    <ShowcaseToastStyleContext value={style}>
      <ToastProvider
        dismissLabel={t(TOAST_DEMO_KEYS.demo_free.toast.dismiss)}
        variant={variant}
        align={align}
      >
        {children}
      </ToastProvider>
    </ShowcaseToastStyleContext>
  );
}
