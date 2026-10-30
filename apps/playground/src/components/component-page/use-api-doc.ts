/**
 * Stackra file contract:
 * Purpose: `useApiDoc`, the generated API of an entry on one platform, loaded when the page asks for it, with its
 *          prop descriptions in the page's language: in Arabic the `api::` catalogue (`ar/api.json`, loaded on
 *          first use so English pages never fetch it) overlays the generated English.
 * Boundary: a hook over `API_DOCS` and `localizeApiDoc`, cached per doc; undefined until the first doc loads and when
 *           none was generated; while another loads, the previous one stays.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 7.1 and 7.4; ADR 0080.
 */
import { type ApiDoc, localizeApiDoc, type Platform } from "@stackra/showcase";
import { useDesignSystem } from "@stackra/ui/react";
import { useEffect, useState } from "react";

import { preloadApiDoc } from "#src/components/component-page/preload-api-doc.function";

/** The Arabic `api::` catalogue, fetched once on the first Arabic page. */
const arabic = () =>
  import("@stackra/showcase/assets/lang/ar/api.json").then((json) => json.default);

export function useApiDoc(platform: Platform, key: string): ApiDoc | undefined {
  const { locale } = useDesignSystem();
  const isArabic = locale.startsWith("ar");
  const [shown, setShown] = useState<{ readonly key: string; readonly doc: ApiDoc | undefined }>();
  useEffect(() => {
    let isLive = true;
    // The previous platform's doc stays until the next arrives: clearing it first collapsed the API section and
    // shifted the page.
    const pending = preloadApiDoc(platform, key);
    if (!pending) setShown({ key, doc: undefined });
    else
      void Promise.all([pending, isArabic ? arabic() : undefined]).then(([loaded, catalogue]) => {
        if (isLive) setShown({ key, doc: localizeApiDoc(loaded, catalogue) });
      });
    return () => {
      isLive = false;
    };
  }, [platform, key, isArabic]);
  // Another component's doc never shows: only a platform switch keeps the previous one.
  return shown?.key === key ? shown.doc : undefined;
}
