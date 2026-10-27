/**
 * Stackra file contract:
 * Purpose: `createApp` of the native target: returns the `NativeApp` whose `Root` Expo registers. `Root` keeps the
 *          splash up while it boots the container from the root module, the generated wiring and the inlined env,
 *          applies the RTL switch of the i18n configuration, loads the locale's catalogues, then mounts the container
 *          and every context in graph order (the navigation context renders the generated tree) and hides the splash.
 *          Boot also loads the session for `ctx.session` and `ctx.identity`.
 * Boundary: synchronous, so the entry needs no top-level await (Hermes has none); boot runs once, on the first mount.
 *           A boot failure is reported and thrown from `Root`, to the error screen. `setLocale` loads the new
 *           catalogues and re-renders; the RTL flip of a locale change applies on the next launch (React Native's
 *           rule).
 * Runtime: react-native
 * Governing contract: ADR 0295 (decisions 7, 8 and 10); ADR 0080; ADR 0192 (RTL); ADR 0457 (session on RouteServices).
 */
import type { ModuleClass } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { I18nConfig } from "@stackra/i18n";
import type { Locale } from "@stackra/i18n";
import { contributeRouteContext } from "@stackra/navigation";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { I18nManager } from "react-native";

import { ConsoleErrorReporterDriver } from "#core/drivers/console-error-reporter.driver";
import { bootApp } from "#core/functions/boot-app.function";
import { loadRouteSession } from "#core/functions/load-route-session.function";
import { routeSessionPart } from "#core/functions/route-session-part.function";
import { messagesOf } from "#core/functions/messages-of.function";
import type { AppMessages } from "#core/types/app-messages.type";
import type { BootedApp } from "#core/types/booted-app.type";
import type { NativeApp } from "#native/types/native-app.type";
import type { NativeAppOptions } from "#native/types/native-app-options.type";
import { Contexts } from "#react/contexts/contexts";

/** The booted app with its active locale and catalogues. */
interface Started extends BootedApp {
  readonly locale: Locale;
  readonly messages: AppMessages;
}

/**
 * The native app of `root`.
 *
 * @example
 * export const app = createApp(MobileModule, { wiring });
 * registerRootComponent(app.Root);
 */
export function createApp(root: ModuleClass, options: NativeAppOptions): NativeApp {
  void SplashScreen.preventAutoHideAsync();
  let starting: Promise<Started> | undefined;

  /** Boots once: the container, the RTL switch and the first catalogues. */
  const start = (): Promise<Started> =>
    (starting ??= (async () => {
      const booted = await bootApp(options.wiring, {
        roots: [root],
        env: globalThis.process?.env ?? {},
      });
      // shortcut: loaded once per launch; refresh it on sign-in and sign-out when identity's device flow needs it.
      await loadRouteSession(booted.container);
      contributeRouteContext(routeSessionPart);
      const i18n = booted.container.get(I18nConfig);
      // shortcut: starts on the default locale; the device locale and the stored choice come with @stackra/storage.
      const locale = i18n.defaultLocale;
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(i18n.rtl.includes(locale));
      return { ...booted, locale, messages: await messagesOf(booted.wiring, locale) };
    })());

  /** Boots behind the splash, then renders the container and the contexts. */
  function Root(): ReactNode {
    const [state, setState] = useState<Started | Error>();

    useEffect(() => {
      start().then(setState, (error: unknown) => {
        new ConsoleErrorReporterDriver().report(error);
        setState(error instanceof Error ? error : new Error(String(error)));
      });
    }, []);

    useEffect(() => {
      if (state !== undefined && !(state instanceof Error)) void SplashScreen.hideAsync();
    }, [state]);

    const setLocale = useCallback(
      async (locale: Locale) => {
        if (state === undefined || state instanceof Error) return;
        const messages = await messagesOf(state.wiring, locale);
        setState({ ...state, locale, messages });
      },
      [state],
    );

    if (state instanceof Error) throw state;
    if (state === undefined) return null;
    return (
      <ContainerProvider container={state.container}>
        <Contexts locale={state.locale} messages={state.messages} setLocale={setLocale} />
      </ContainerProvider>
    );
  }

  return { Root };
}
