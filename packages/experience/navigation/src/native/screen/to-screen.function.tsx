/**
 * Stackra file contract:
 * Purpose: `toScreen({ route, page })`, one entry of gen's route table as a React Navigation screen component: it
 *          validates the screen's params against the route's shape, runs the route's loader (a `document:` route
 *          resolves its document), follows a redirect, and renders the page with `{ data, params, search }` under a
 *          reload the page reaches with `useRouteReload`. Loading shows a spinner, a failure the error state with a
 *          retry.
 * Boundary: gen writes the calls in `#stackra/navigation`; a hand-written navigator is banned. The loader runs in the
 *           app's current locale with the container above the navigator.
 * Runtime: react-native
 * Governing contract: ADR 0165 (React Navigation; expo-router rejected); ADR 0294 (decisions 14 and 16); ADR 0110.
 */
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import { useContainer } from "@stackra/container/react";
import { useLocale } from "@stackra/i18n/react";
import { ErrorState, Spinner } from "@stackra/ui/native";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import { Linking } from "react-native";

import type { RouteClass } from "#core/types/route-class.type";
import type { RouteProps } from "#core/types/route-props.type";
import { RouteReloadContext } from "#native/route-reload/route-reload-context";
import { followRedirect } from "#native/screen/follow-redirect.function";
import { nativeLoad } from "#native/screen/native-load.function";

// shortcut: English until the package ships its `navigation::errors.*` catalogue; swap in the keys then.
const STRINGS = { failed: "This screen could not load", retry: "Try again" } as const;

/** A page with its route's typing erased: the adapter hands it the `{ data, params, search }` the router holds. */
type ErasedPage = ComponentType<{
  readonly data: unknown;
  readonly params: unknown;
  readonly search: unknown;
}>;

/** What a screen shows. */
type ScreenState =
  | { readonly status: "loading" }
  | { readonly status: "failed"; readonly error: unknown }
  | {
      readonly status: "ready";
      readonly data: unknown;
      readonly params: unknown;
      readonly search: unknown;
    };

/** Opens an outside URL in the system browser. */
const openUrl = (url: string): void => {
  Linking.openURL(url).catch(() => undefined); // nothing on the device handles it: the screen stays
};

/**
 * The screen component of `entry`.
 *
 * @example
 * <HomeStack.Screen name="home" component={toScreen(routeTable.home)} />
 */
export function toScreen<R extends RouteClass>(entry: {
  readonly route: R;
  readonly page: ComponentType<RouteProps<R>>;
}): ComponentType<{ readonly route: { readonly params?: object | undefined } }> {
  return function Screen({ route }: { readonly route: { readonly params?: object | undefined } }) {
    const container = useContainer();
    const { locale } = useLocale();
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const params = useMemo(() => ({ ...route.params }), [route.params]);
    const [state, setState] = useState<ScreenState>({ status: "loading" });
    const [isRunning, setRunning] = useState(false);
    const run = useCallback(async () => {
      setRunning(true);
      try {
        const outcome = await nativeLoad(entry.route, { container, locale, params, openUrl });
        if (outcome.kind === "redirect") followRedirect(navigation, outcome.redirect, openUrl);
        else setState({ status: "ready", ...outcome });
      } catch (error) {
        setState({ status: "failed", error });
      } finally {
        setRunning(false);
      }
    }, [container, locale, params, navigation]);
    useEffect(() => {
      void run();
    }, [run]);
    const reload = useMemo(() => ({ run, isRunning }), [run, isRunning]);
    if (state.status === "loading") return <Spinner size="lg" />;
    if (state.status === "failed")
      return (
        <ErrorState
          title={STRINGS.failed}
          error={state.error}
          retry={{ label: STRINGS.retry, onPress: () => void run() }}
        />
      );
    return (
      <RouteReloadContext value={reload}>
        {createElement(entry.page as ErasedPage, {
          data: state.data,
          params: state.params,
          search: state.search,
        })}
      </RouteReloadContext>
    );
  };
}
