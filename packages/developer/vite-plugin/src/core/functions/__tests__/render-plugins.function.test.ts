/**
 * Stackra file contract:
 * Purpose: unit tests of `renderPlugins`: a single-page app gets React and Tailwind; a server-rendered member gets the
 *          Workers runtime for `ssr` over gen's Wrangler config, Tailwind and React Router, and no React plugin.
 * Boundary: test only; the four framework plugins are mocked to named markers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0297 (decisions 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { renderPlugins } from "#core/functions/render-plugins.function";

const { cloudflare } = vi.hoisted(() => ({ cloudflare: vi.fn(() => ({ name: "cloudflare" })) }));
vi.mock("@vitejs/plugin-react", () => ({ default: () => ({ name: "react" }) }));
vi.mock("@tailwindcss/vite", () => ({ default: () => ({ name: "tailwindcss" }) }));
vi.mock("@cloudflare/vite-plugin", () => ({ cloudflare }));
vi.mock("@react-router/dev/vite", () => ({ reactRouter: () => ({ name: "react-router" }) }));

describe("renderPlugins", () => {
  it("builds a single-page app with React and Tailwind", async () => {
    expect(await renderPlugins(false)).toEqual([{ name: "react" }, { name: "tailwindcss" }]);
    expect(cloudflare).not.toHaveBeenCalled();
  });

  it("renders on the Worker through React Router framework mode", async () => {
    expect(await renderPlugins(true)).toEqual([
      { name: "cloudflare" },
      { name: "tailwindcss" },
      { name: "react-router" },
    ]);
    expect(cloudflare).toHaveBeenCalledWith({
      configPath: ".stackra/wrangler.jsonc",
      viteEnvironment: { name: "ssr" },
    });
  });
});
