/**
 * Stackra file contract:
 * Purpose: proves the web BrandLogo draws the host's logo for the scheme on screen and follows a scheme change, draws
 *          the scheme `mode` names, draws the theme's own logo through the container's `AssetLibrary`, shows the
 *          fallback with no logo, is an image named by `label` and decorative without it, sizes its box from `size`
 *          and `aspectRatio`, and keeps its layout logical in Arabic.
 * Boundary: unit tier, jsdom, the real @stackra/ui `Thumbnail` and a real `ColorSchemeService` (memory storage and
 *           system preference) in a container; `AssetLibrary` is a stand-in that maps a key to a URL, as a disk would.
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

import { ColorSchemeService, ThemingConfig } from "#core/index";
import { BrandLogo } from "#react/brand-logo/brand-logo";
import { fakeColorScheme } from "#testing/functions/fake-color-scheme.function";

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

/** The `src` of the drawn picture. */
const drawn = () => document.querySelector("[data-slot='thumbnail-image']")?.getAttribute("src");

describe("BrandLogo (web)", () => {
  afterEach(cleanup);

  it("draws the host's logo for the scheme on screen and follows a change", async () => {
    const { service, wrap } = await setUp();
    render(wrap(<BrandLogo size={32} logo={LOGO} label="Acme" fallback="Acme" />));
    expect(drawn()).toBe(LOGO.light);
    act(() => service.setScheme("dark"));
    expect(drawn()).toBe(LOGO.dark);
  });

  it("draws the scheme mode names", async () => {
    const { wrap } = await setUp();
    render(wrap(<BrandLogo size={32} logo={LOGO} mode="dark" label="Acme" fallback="Acme" />));
    expect(drawn()).toBe(LOGO.dark);
  });

  it("draws the theme's own logo through the asset library", async () => {
    const { wrap } = await setUp("acme::public/logo.svg");
    render(wrap(<BrandLogo size={32} label="Acme" fallback="Acme" />));
    expect(drawn()).toBe("https://cdn.test/acme/public/logo.svg");
  });

  it("shows the fallback with no logo", async () => {
    const { wrap } = await setUp();
    render(wrap(<BrandLogo size={32} fallback={<span>Acme</span>} />));
    expect(screen.getByText("Acme")).toBeTruthy();
    expect(drawn()).toBeUndefined();
  });

  it("shows the fallback when the host has no logo for the scheme", async () => {
    const { wrap } = await setUp();
    render(
      wrap(<BrandLogo size={32} logo={{ ...LOGO, dark: null }} mode="dark" fallback="Acme" />),
    );
    expect(screen.getByText("Acme")).toBeTruthy();
  });

  it("is an image named by label, and decorative without one", async () => {
    const { wrap } = await setUp();
    const { rerender } = render(
      wrap(<BrandLogo size={32} logo={LOGO} label="Acme" fallback="Acme" />),
    );
    expect(screen.getByRole("img", { name: "Acme" })).toBeTruthy();
    rerender(wrap(<BrandLogo size={32} logo={LOGO} fallback="Acme" />));
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelector("[data-slot='thumbnail']")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("sizes its box from size and aspectRatio", async () => {
    const { wrap } = await setUp();
    render(wrap(<BrandLogo size={24} aspectRatio={4} logo={LOGO} label="Acme" fallback="Acme" />));
    const box = screen.getByRole("img", { name: "Acme" });
    expect(box.style.width).toBe("96px");
  });

  it("keeps its layout logical in Arabic", async () => {
    const { wrap } = await setUp();
    render(wrap(<BrandLogo size={32} logo={LOGO} label="أكمي" fallback="أكمي" />, "rtl"));
    const box = screen.getByRole("img", { name: "أكمي" });
    expect(box.className).not.toMatch(/\b(text-left|text-right|ml-|mr-|pl-|pr-|left-|right-)/);
  });
});
