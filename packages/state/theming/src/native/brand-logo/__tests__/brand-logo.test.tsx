/**
 * Stackra file contract:
 * Purpose: proves the native BrandLogo draws the host's logo for the scheme on screen and follows a scheme change,
 *          draws the scheme `mode` names, draws the theme's own logo through the container's `AssetLibrary`, shows the
 *          fallback (nothing by default) with no logo, names the image by `label` and hides it without one, sizes its
 *          box from `height` (32 by default) and `aspectRatio`, and lays out the same under right-to-left.
 * Boundary: unit tier, jsdom. React Native does not render in vitest, so `@stackra/ui/native` is replaced by a DOM
 *           stand-in that keeps the Thumbnail's contract (an image named by `alt`, hidden without it); the
 *           `ColorSchemeService` and its container are real, and `AssetLibrary` maps a key to a URL as a disk would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0504; ADR 0060 (light, dark and right-to-left); ADR 0234.
 */
// @vitest-environment jsdom
import { AssetLibrary } from "@stackra/assets";
import { buildConfig } from "@stackra/config";
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";

import { ColorSchemeService, ThemingConfig } from "#core/index";
import { BrandLogo } from "#native/brand-logo/brand-logo";
import { fakeColorScheme } from "#testing/functions/fake-color-scheme.function";

/** What the stand-in Thumbnail receives. */
interface ThumbnailStandInProps {
  readonly src: string;
  readonly alt?: string;
  readonly fit: string;
  readonly aspectRatio: number;
  readonly style: { readonly width: number };
}

vi.mock("@stackra/ui/native", async () => {
  const { createElement } = await import("react");
  return {
    Thumbnail: ({ src, alt, fit, aspectRatio, style }: ThumbnailStandInProps) =>
      createElement("span", {
        ...(alt === undefined ? { "aria-hidden": true } : { role: "img", "aria-label": alt }),
        "data-src": src,
        "data-fit": fit,
        "data-aspect-ratio": aspectRatio,
        "data-width": style.width,
      }),
  };
});

const LOGO = { light: "https://cdn.test/logo-light.png", dark: "https://cdn.test/logo-dark.png" };

/** An `AssetLibrary` stand-in: the URL a disk at `https://cdn.test` would give a key. */
const LIBRARY = {
  resolve: ({ key }: { key: string }) => ({
    key,
    file: "",
    url: `https://cdn.test/${key.replace("::", "/")}`,
  }),
};

/** A service over memory storage and a wrapper that binds it, with the theme's `logo` when one is given. */
async function setUp(logo: string | null = null) {
  const config = buildConfig(ThemingConfig, { values: { logo } });
  const service = fakeColorScheme({ config });
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [ThemingConfig, config],
      [ColorSchemeService, service],
      [AssetLibrary, LIBRARY],
    ]),
  });
  const wrap = (children: ReactNode, dir: "ltr" | "rtl" = "ltr") => (
    <ContainerProvider container={container}>
      <div dir={dir}>{children}</div>
    </ContainerProvider>
  );
  return { service, wrap };
}

describe("BrandLogo (native)", () => {
  afterEach(cleanup);

  it("draws the host's logo for the scheme on screen and follows a change", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<BrandLogo logo={LOGO} label="Acme" />));
    const image = screen.getByRole("img", { name: "Acme" });
    expect(image.dataset.src).toBe(LOGO.light);
    expect(image.dataset.fit).toBe("contain");
    act(() => service.setScheme("dark"));
    expect(screen.getByRole("img", { name: "Acme" }).dataset.src).toBe(LOGO.dark);
  });

  it("draws the scheme mode names", async () => {
    const { wrap } = await setUp();
    render(wrap(<BrandLogo logo={LOGO} mode="dark" label="Acme" />));
    expect(screen.getByRole("img", { name: "Acme" }).dataset.src).toBe(LOGO.dark);
  });

  it("draws the theme's own logo through the asset library", async () => {
    const { wrap } = await setUp("acme::public/logo.png");
    render(wrap(<BrandLogo label="Acme" />));
    expect(screen.getByRole("img", { name: "Acme" }).dataset.src).toBe(
      "https://cdn.test/acme/public/logo.png",
    );
  });

  it("shows the fallback with no logo, and nothing by default", async () => {
    const { wrap } = await setUp();
    const { container, rerender } = render(wrap(<BrandLogo fallback={<span>Acme</span>} />));
    expect(screen.getByText("Acme")).toBeTruthy();
    rerender(wrap(<BrandLogo />));
    expect(container.textContent).toBe("");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("hides the image from assistive technology without a label", async () => {
    const { wrap } = await setUp();
    const { container } = render(wrap(<BrandLogo logo={LOGO} />));
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("[aria-hidden='true']")?.getAttribute("data-src")).toBe(
      LOGO.light,
    );
  });

  it("sizes its box from height, 32 by default, and aspectRatio", async () => {
    const { wrap } = await setUp();
    const { rerender } = render(wrap(<BrandLogo logo={LOGO} label="Acme" />));
    expect(screen.getByRole("img", { name: "Acme" }).dataset.width).toBe("32");
    rerender(wrap(<BrandLogo logo={LOGO} label="Acme" height={24} aspectRatio={4} />));
    const image = screen.getByRole("img", { name: "Acme" });
    expect(image.dataset.width).toBe("96");
    expect(image.dataset.aspectRatio).toBe("4");
  });

  it("draws the same logo under right-to-left", async () => {
    const { wrap } = await setUp();
    render(wrap(<BrandLogo logo={LOGO} label="أكمي" />, "rtl"));
    expect(screen.getByRole("img", { name: "أكمي" }).dataset.src).toBe(LOGO.light);
  });
});
