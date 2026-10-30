/**
 * Stackra file contract:
 * Purpose: the Theme Studio's canvas: a page template, built from real @stackra/ui components, drawn inside a device
 *          (a desktop browser, an iPad, an iPhone or an Android phone, `StudioDevice`) in the derived theme, so every
 *          change is seen at once.
 *          - Theme: the theme's custom properties (HeroUI's and Stackra's, for the scheme drawn) and its display
 *            faces (`--font-display`, `--font-display-arabic`) are set inline on the device's screen only, so the
 *            theme reaches the canvas and nothing else.
 *          - Templates: dashboard, settings form, storefront, onboarding, mobile app and the component sheet, picked
 *            in the bar under the canvas (the house `SegmentedControl`, icon and name, on the control radius; it
 *            scrolls sideways when the canvas is narrower than its six choices).
 *          - View (the top bar's): Fit scales the whole device, body and all, to the room the canvas has, both ways,
 *            so it never scrolls; a set zoom draws at that scale and the canvas scrolls. The template scrolls inside
 *            the screen. Side by side draws the template twice, light and dark, fitted together. Below 100% the
 *            screen's content is a picture to look at (it still scrolls); at its real size it can be tried.
 * Boundary: presentation only; the theme, scheme and view come from the page. Overlays a template opens (a select's
 *           list) render outside the canvas, in the page's theme.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0340 (decision 2).
 */
import { themeVariables } from "@stackra/tokens";
import { SegmentedControl, useCatalogueText } from "@stackra/ui/react";
import { type CSSProperties, useEffect, useRef, useState } from "react";

import { STUDIO_TEMPLATES } from "#src/components/studio-templates";
import { MESSAGES } from "#src/constants/messages.constant";
import { THEME_STUDIO_KEYS } from "#src/routes/theme-studio/theme-studio-keys.constant";

import { deviceBox } from "./device-box.function";
import { fitScale } from "./fit-scale.function";
import { StudioDevice } from "./studio-device";
import type { StudioPreviewProps } from "./studio-preview.props";

/** The canvas's keys. */
const K = THEME_STUDIO_KEYS.theme_studio.canvas;

/** The gap between two devices side by side, in px. */
const GAP = 32;

type TemplateId = (typeof STUDIO_TEMPLATES)[number]["id"];

/** The canvas. */
export function StudioPreview({ theme, scheme, view, fonts }: StudioPreviewProps) {
  const t = useCatalogueText(MESSAGES.en);
  const [templateId, setTemplateId] = useState<TemplateId>("dashboard");
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const area = useRef<HTMLDivElement>(null);

  // Fit follows the room the canvas has, which the rails, the inspector and the window change.
  useEffect(() => {
    const element = area.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setRoom({ width: entry?.contentRect.width ?? 0, height: entry?.contentRect.height ?? 0 }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const template = STUDIO_TEMPLATES.find(({ id }) => id === templateId) ?? STUDIO_TEMPLATES[0];
  const schemes = view.isSideBySide ? (["light", "dark"] as const) : [scheme];
  const isFit = view.zoom === "fit";
  const scale = isFit
    ? fitScale(room, deviceBox(view).body, schemes.length, GAP)
    : Number(view.zoom) / 100;
  const { heroui, stackra } = themeVariables(theme);
  const sheetStyle = (drawn: "light" | "dark") =>
    ({
      ...heroui.root,
      ...stackra.root,
      ...heroui[drawn],
      ...stackra[drawn],
      "--font-display": fonts.display,
      "--font-display-arabic": fonts.displayArabic,
      colorScheme: drawn,
    }) as CSSProperties;

  return (
    <section
      aria-label={t(K.label)}
      className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto]"
    >
      <div
        ref={area}
        className={`min-h-0 bg-surface-secondary p-8 ${isFit ? "overflow-hidden" : "overflow-auto"}`}
      >
        {/* `m-auto` in a flex box centres the devices and, unlike `justify-center`, never cuts off what overflows. */}
        <div className="flex min-h-full min-w-full w-max">
          <div className="m-auto flex items-start gap-8" style={{ zoom: scale }}>
            {schemes.map((drawn) => (
              <StudioDevice
                key={drawn}
                view={view}
                scheme={drawn}
                sheetStyle={sheetStyle(drawn)}
                label={t(K.frame, {
                  template: t(K.template_names[template.id]),
                  scheme: t(K[drawn]),
                })}
                time={t(K.status_time)}
                // Shrunk, the screen is a picture: its controls would be smaller than 24px (SC 2.5.8).
                isInert={scale < 1}
              >
                <template.Component />
              </StudioDevice>
            ))}
          </div>
        </div>
      </div>
      {/* `mx-auto` on a `w-max` row centres it while it fits and, unlike `justify-center`, lets it scroll from its
          start edge once it does not. */}
      <div className="overflow-x-auto overscroll-x-contain border-t border-separator bg-background px-4 py-2">
        <SegmentedControl
          label={t(K.templates)}
          size="sm"
          items={STUDIO_TEMPLATES.map(({ id, icon }) => ({
            id,
            icon,
            label: t(K.template_names[id]),
          }))}
          selectedKey={template.id}
          onSelectionChange={(key) => {
            const picked = STUDIO_TEMPLATES.find(({ id }) => id === key);
            if (picked) setTemplateId(picked.id);
          }}
          className="mx-auto w-max"
        />
      </div>
    </section>
  );
}
