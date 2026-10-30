/**
 * Stackra file contract:
 * Purpose: the web `Turnstile`: Cloudflare's Turnstile challenge in a form, loaded from Cloudflare's script on first use
 *          and rendered explicitly, which puts its token in a hidden input named `name`, so the form posts it with the
 *          fields (`<Turnstile name="captchaToken" />`) and the server verifies it with the secret.
 * Boundary: no dependency: the script is added once per page, and each widget is removed when its component unmounts.
 *           Renders an empty box on the server and fills it in the browser; the page's CSP must allow
 *           `https://challenges.cloudflare.com` in `script-src`, `frame-src` and `connect-src`. Without a site key it
 *           draws nothing and warns, so the server's verification refuses the post. A failed challenge goes to `onError` and is
 *           marked handled, so Cloudflare's script does not throw it on the page.
 * Runtime: browser
 * Governing contract: ADR 0165 (decision 2: form adapters in @stackra/ui); owner decision 12 of 2026-10-25 (Turnstile
 *                     in `./react`); ADR 0302 (decision 3).
 */
import { type ReactElement, useEffect, useRef } from "react";
import type { TurnstileProps } from "#react/turnstile/turnstile.props";

/** The part of Cloudflare's `window.turnstile` this component calls. */
interface TurnstileApi {
  /** Draws a widget into `container`; returns its id. */
  render: (container: HTMLElement, options: Readonly<Record<string, unknown>>) => string;
  /** Removes the widget with `id`. */
  remove: (id: string) => void;
}

/** Cloudflare's script, in explicit mode so the component decides where and when a widget draws. */
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// shortcut: the Vite public env name the template's EnvConfig maps (`turnstileSiteKey`), read from `import.meta.env`,
// which Vite fills at build time and other bundlers leave undefined. Upgrade when gen hands the site key to
// @stackra/ui's configuration.
const PUBLIC_SITE_KEY = (
  import.meta as unknown as { env?: Readonly<Record<string, string | undefined>> }
).env?.VITE_TURNSTILE_SITE_KEY;

/** The page's one load of the script; cleared on failure so a later widget tries again. */
let loading: Promise<TurnstileApi> | undefined;

/** Cloudflare's API once its script has run. */
function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.addEventListener("load", () => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (api) resolve(api);
      else reject(new Error("Cloudflare's Turnstile script ran but defined no `turnstile`"));
    });
    script.addEventListener("error", () => {
      loading = undefined;
      reject(new Error("Cloudflare's Turnstile script did not load"));
    });
    document.head.append(script);
  });
  return loading;
}

/** Cloudflare Turnstile, posting its token under `name`. */
export function Turnstile({
  name = "cf-turnstile-response",
  siteKey = PUBLIC_SITE_KEY,
  onError,
}: TurnstileProps): ReactElement {
  const container = useRef<HTMLDivElement>(null);
  const latestOnError = useRef(onError);
  // oxlint-disable-next-line react/refs -- reason: the widget's error callback reads the latest handler; the ref is never read to render
  latestOnError.current = onError;

  useEffect(() => {
    if (!siteKey) {
      // oxlint-disable-next-line no-console -- reason: a developer warning; @stackra/ui has no logger dependency
      console.warn("@stackra/ui: Turnstile has no site key, so it draws nothing.");
      return undefined;
    }
    let isMounted = true;
    let widgetId: string | undefined;
    let api: TurnstileApi | undefined;
    loadTurnstile()
      .then((loaded) => {
        api = loaded;
        if (isMounted && container.current)
          widgetId = loaded.render(container.current, {
            sitekey: siteKey,
            "response-field-name": name,
            // A truthy return tells Cloudflare the error is handled, so its script does not throw it uncaught.
            "error-callback": (code: string) => {
              latestOnError.current?.(code);
              return true;
            },
          });
      })
      // oxlint-disable-next-line no-console -- reason: a developer warning; @stackra/ui has no logger dependency
      .catch((error: unknown) => console.warn(`@stackra/ui: ${String(error)}`));
    return () => {
      isMounted = false;
      if (widgetId !== undefined) api?.remove(widgetId);
    };
  }, [name, siteKey]);

  return <div ref={container} />;
}
