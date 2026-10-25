/**
 * Stackra file contract:
 * Purpose: `useLayoutLoader(LayoutClass, key?)`, a native layout's loader run for the generated navigation tree before
 *          any screen below it mounts: `redirected` when it answers a redirect (no session), else its data.
 * Boundary: runs on mount and again whenever `key` changes (the tree passes the session status, so signing in runs it
 *           again) or `reload()` is called; a run that a newer one replaced is ignored. Runs in the app's current
 *           locale with the container above the tree.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16: a layout's loader runs before any child's); ADR 0165.
 */
import type { AnyClass } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { useLocale } from "@stackra/i18n/react";
import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";

import type { Layout } from "#core/bases/layout.base";
import type { LoaderData } from "#core/types/loader-data.type";
import type { LayoutLoaderState } from "#native/layout-loader/layout-loader-state.type";
import { nativeLoad } from "#native/screen/native-load.function";

/** Opens an outside URL in the system browser. */
const openUrl = (url: string): void => {
  Linking.openURL(url).catch(() => undefined); // nothing on the device handles it
};

/**
 * The state of `type`'s loader.
 *
 * @example
 * const shell = useLayoutLoader(TabsLayout, session.status);
 * if (shell.redirected) return <SignedOutStack />;
 */
export function useLayoutLoader<L extends AnyClass<Layout>>(
  type: L,
  key?: unknown,
): LayoutLoaderState<L> {
  const container = useContainer();
  const { locale } = useLocale();
  const [state, setState] = useState({
    isLoading: true,
    redirected: false,
    data: undefined as LoaderData<InstanceType<L>> | undefined,
    error: undefined as unknown,
  });
  const [runs, setRuns] = useState(0);
  useEffect(() => {
    let isCurrent = true;
    nativeLoad(type, { container, locale, params: {}, openUrl }).then(
      (outcome) => {
        if (!isCurrent) return;
        setState((current) =>
          outcome.kind === "redirect"
            ? { ...current, isLoading: false, redirected: true, error: undefined }
            : {
                isLoading: false,
                redirected: false,
                data: outcome.data as LoaderData<InstanceType<L>>,
                error: undefined,
              },
        );
      },
      (error: unknown) => {
        if (isCurrent) setState((current) => ({ ...current, isLoading: false, error }));
      },
    );
    return () => {
      isCurrent = false;
    };
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- reason: `key` and `runs` are the re-run triggers
  }, [type, container, locale, key, runs]);
  const reload = useCallback(() => setRuns((current) => current + 1), []);
  return { ...state, reload };
}
