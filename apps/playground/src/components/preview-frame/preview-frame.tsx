/**
 * Stackra file contract:
 * Purpose: `PreviewFrame`, a live second copy of a demo on a component page (the Right-to-left preview, the Stackra
 *          section's direction and brand frames): a named region in its own direction, language and catalogues,
 *          optionally in a brand layer's variables, whose overlays portal into the frame so they keep its scope. The
 *          demo mounts once the frame nears the viewport.
 * Boundary: mounting only; the demo is `LiveDemo`'s. Demos give their elements `useId` ids, so a copy adds none twice.
 * Runtime: browser
 * Governing contract: STA-1371 (live preview frames, 2026-10-29); ADR 0060 (RTL); ADR 0340 (decision 2).
 */
import { I18nProvider } from "@heroui/react";
import { themeVariables } from "@stackra/tokens";
import { PortalContainer, useCatalogueText, useDesignSystem } from "@stackra/ui/react";
import { type CSSProperties, type ReactElement, useEffect, useState } from "react";

import { LiveDemo } from "#src/components/component-page/live-demo";
import { DOC_PAGE_KEYS } from "#src/components/doc-page/doc-page-keys.constant";
import type { PreviewFrameProps } from "#src/components/preview-frame/preview-frame.props";
import { ShowcaseI18n } from "#src/components/showcase-i18n/showcase-i18n";
import { brandThemeOf } from "#src/components/studio-brands";
import { MESSAGES } from "#src/constants/messages.constant";

/** The named landmarks a demo may draw: each takes the frame's name too, so a copy never repeats the live one's. */
const LANDMARKS =
  "form[aria-label], section[aria-label], nav[aria-label], aside[aria-label], main[aria-label], search[aria-label], " +
  "[role=region][aria-label], [role=navigation][aria-label], [role=complementary][aria-label], " +
  "[role=form][aria-label], [role=search][aria-label]";

/** One live, named, lazily mounted copy of a demo. */
export function PreviewFrame({
  path,
  label,
  dir,
  lang,
  brand,
  className,
  caption,
}: PreviewFrameProps): ReactElement {
  const t = useCatalogueText(MESSAGES.en);
  const { resolvedColorScheme } = useDesignSystem();
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const [isNear, setNear] = useState(false);

  // The demo mounts once the frame nears the viewport; without an observer (a test) it mounts at once.
  useEffect(() => {
    if (!frame || isNear) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      // oxlint-disable-next-line react/set-state-in-effect -- reason: with no IntersectionObserver (a test) there is nothing to wait for, so the demo mounts at once
      setNear(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((item) => item.isIntersecting)) setNear(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame, isNear]);

  // shortcut: the frame's demo is a second live copy in the same document, so a landmark it names ("Field states")
  // would repeat the Usage copy's (axe landmark-unique). Each named landmark inside gets the frame's name appended,
  // after every render that sets it; a frame per iframe would isolate them instead, once the preview needs it.
  const suffix = t(DOC_PAGE_KEYS.showcase.doc.ui.rtl_preview_scoped, { name: "", frame: label });
  useEffect(() => {
    if (!frame || !isNear || typeof MutationObserver === "undefined") return undefined;
    const scope = (): void => {
      for (const landmark of frame.querySelectorAll(LANDMARKS)) {
        const name = landmark.getAttribute("aria-label") ?? "";
        if (landmark !== frame && !name.endsWith(suffix))
          landmark.setAttribute("aria-label", `${name}${suffix}`);
      }
    };
    scope();
    const observer = new MutationObserver(scope);
    observer.observe(frame, { subtree: true, childList: true, attributeFilter: ["aria-label"] });
    return () => observer.disconnect();
  }, [frame, isNear, suffix]);

  let sheet: CSSProperties | undefined;
  if (brand) {
    // The brand's variables on the frame, as the storm hero draws a brand: its children and portalled overlays inherit them.
    const { heroui, stackra } = themeVariables(brandThemeOf(brand));
    sheet = {
      ...heroui.root,
      ...stackra.root,
      ...heroui[resolvedColorScheme],
      ...stackra[resolvedColorScheme],
      "--font-display": `"${brand.display}", var(--font-sans)`,
      "--font-display-arabic": `"${brand.displayArabic}", var(--font-arabic)`,
    } as CSSProperties;
  }

  return (
    <div
      ref={setFrame}
      role="region"
      aria-label={label}
      dir={dir}
      lang={lang}
      data-brand={brand?.id}
      style={sheet}
      className={className}
    >
      {caption}
      {/* The overlays' layer: inside the frame, so they keep its variables, direction and language, and fixed, so
          the frame's clipping card never cuts a popover or a list short; at the physical top left, the
          origin React Aria places popovers from in either direction. */}
      <div
        ref={setLayer}
        data-slot="preview-frame-layer"
        className="fixed top-0 left-0 z-(--z-overlay)"
      />
      {isNear && frame ? (
        <PortalContainer container={layer}>
          {/* React Aria's own locale too, so its popovers, keys and formats follow the frame, not the page. */}
          <I18nProvider locale={lang}>
            <ShowcaseI18n locale={lang}>
              <LiveDemo path={path} />
            </ShowcaseI18n>
          </I18nProvider>
        </PortalContainer>
      ) : null}
    </div>
  );
}
