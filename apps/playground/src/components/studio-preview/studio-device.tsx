/**
 * Stackra file contract:
 * Purpose: `StudioDevice`: one device of the studio canvas, drawn by the studio in CSS and inline SVG (clean-room):
 *          - Desktop: a browser window, its title bar and the screen under it.
 *          - iPad: even bezels, a status bar (clock, signal, Wi-Fi, battery) and a home indicator.
 *          - iPhone: rounded body and screen, a Dynamic Island, a status bar and a home indicator; on its side the
 *            status bar hides and the island moves to the left edge, as the phone does.
 *          - Android phone: a punch-hole camera, a status bar and a gesture bar.
 *          The screen wears the theme: the status bar and the bars below read its background and foreground, and the
 *          template scrolls between them. The body is hardware: dark beside a light screen, a lighter grey beside a
 *          dark one, so its edge shows on either canvas; its corners never follow the theme's radius.
 * Boundary: presentation only.
 * Runtime: browser
 * Governing contract: ADR 0320 (the Theme Studio).
 */
import type { CSSProperties } from "react";

import { deviceBox } from "./device-box.function";
import type { StudioDeviceProps } from "./studio-device.props";

/** The body's colour beside each scheme of screen. */
const BODY = { light: "oklch(0.24 0.005 260)", dark: "oklch(0.42 0.005 260)" } as const;

/** The status bar's glyphs (signal, Wi-Fi, battery), in the screen's foreground. */
function StatusGlyphs() {
  return (
    <svg width="68" height="12" viewBox="0 0 68 12" fill="currentColor" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <rect key={bar} x={bar * 4.5} y={9 - bar * 2.5} width="3" height={3 + bar * 2.5} rx="0.8" />
      ))}
      <path d="M29 3.2a9 9 0 0 1 11 0l-1.3 1.5a7 7 0 0 0-8.4 0zM31.2 5.8a5.6 5.6 0 0 1 6.6 0l-1.4 1.5a3.6 3.6 0 0 0-3.8 0zM34.5 11l-1.8-2a2.6 2.6 0 0 1 3.6 0z" />
      <rect
        x="44"
        y="1"
        width="20"
        height="10"
        rx="3"
        fill="none"
        stroke="currentColor"
        opacity="0.45"
      />
      <rect x="46" y="3" width="14" height="6" rx="1.5" />
      <rect x="65" y="4" width="1.6" height="4" rx="0.8" opacity="0.45" />
    </svg>
  );
}

/** One device of the canvas. */
export function StudioDevice({
  view,
  scheme,
  sheetStyle,
  label,
  time,
  isInert,
  children,
}: StudioDeviceProps) {
  const { frame, screen, body, isLandscape } = deviceBox(view);
  const { device } = view;
  const isDesktop = device === "desktop";
  const hasStatusBar = !isDesktop && !(device === "iphone" && isLandscape);
  const camera: CSSProperties | undefined =
    device === "iphone"
      ? isLandscape
        ? { left: 11, top: "50%", width: 34, height: 120, translate: "0 -50%" }
        : { top: 11, left: "50%", width: 120, height: 34, translate: "-50% 0" }
      : device === "android"
        ? isLandscape
          ? { left: 10, top: "50%", width: 12, height: 12, translate: "0 -50%" }
          : { top: 10, left: "50%", width: 12, height: 12, translate: "-50% 0" }
        : undefined;
  // A phone on its side keeps its camera's edge clear, as the system's safe area does.
  const sideInset = isLandscape && device !== "tablet" ? 48 : 0;

  return (
    <figure
      aria-label={label}
      className={`relative shrink-0 ${isDesktop ? "overflow-hidden border border-border bg-surface shadow-[var(--overlay-shadow)]" : ""}`}
      style={{
        width: body.width,
        height: body.height,
        borderRadius: frame.radius,
        padding: frame.bezel,
        ...(isDesktop
          ? {}
          : {
              background: BODY[scheme],
              boxShadow:
                "inset 0 0 0 1.5px oklch(1 0 0 / 0.14), 0 0 0 1px oklch(0 0 0 / 0.25), 0 30px 60px -20px oklch(0 0 0 / 0.45)",
            }),
      }}
    >
      {isDesktop ? (
        <div
          aria-hidden="true"
          className="flex items-center gap-1.5 border-b border-border px-4"
          style={{ height: frame.top }}
        >
          {[0, 1, 2].map((dot) => (
            <span
              key={dot}
              className="size-2.5 bg-default"
              style={{ borderRadius: "var(--radius-full)" }}
            />
          ))}
        </div>
      ) : null}
      <div
        style={{
          ...sheetStyle,
          width: screen.width,
          height: screen.height,
          borderRadius: frame.screenRadius,
        }}
        data-theme={scheme}
        className={`relative flex flex-col overflow-hidden bg-background text-foreground [font-family:var(--font-sans)] rtl:[font-family:var(--font-arabic)] ${scheme === "dark" ? "dark" : ""}`}
      >
        {hasStatusBar ? (
          <div
            aria-hidden="true"
            className={`flex shrink-0 items-center justify-between text-foreground ${device === "tablet" ? "px-6 text-xs" : "px-7 text-[15px]"} font-semibold`}
            style={{ height: frame.top, paddingInline: device === "android" ? 20 : undefined }}
          >
            <span className="tabular-nums">{time}</span>
            <StatusGlyphs />
          </div>
        ) : null}
        <div
          // The screen scrolls by wheel, touch and keys; at a scaled zoom its content is a picture (inert), not this.
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- reason: a scroll region must take focus so a keyboard user can scroll it (WCAG 2.1.1)
          tabIndex={0}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${isDesktop ? "" : "[scrollbar-width:none]"}`}
          style={{ paddingInline: sideInset }}
        >
          <div
            inert={isInert}
            className={`@container ${device === "iphone" || device === "android" ? "px-4 py-4" : "p-6 @3xl:p-10"}`}
          >
            {children}
          </div>
        </div>
        {isDesktop ? null : (
          <div
            aria-hidden="true"
            className="grid shrink-0 place-items-center"
            style={{ height: isLandscape && device === "iphone" ? 21 : frame.bottom }}
          >
            <span
              className="h-[5px] bg-foreground"
              style={{
                width: device === "android" ? 108 : device === "tablet" ? 300 : 134,
                borderRadius: "var(--radius-full)",
                opacity: 0.85,
              }}
            />
          </div>
        )}
        {camera ? (
          <span
            aria-hidden="true"
            className="absolute z-10"
            style={{ ...camera, borderRadius: "var(--radius-full)", background: "oklch(0.08 0 0)" }}
          />
        ) : null}
      </div>
    </figure>
  );
}
