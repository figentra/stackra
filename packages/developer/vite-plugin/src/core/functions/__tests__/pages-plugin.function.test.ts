/**
 * Stackra file contract:
 * Purpose: unit tests of `pagesPlugin`: the dev middleware rewrites a navigation to the longest matching locale page
 *          and leaves module requests alone; the build moves each generated page to its prefix and, under a relative
 *          base, rewrites its relative asset URLs to the new depth.
 * Boundary: test only; drives the middleware with fake requests and `generateBundle` with a fake bundle.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0297 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { pagesPlugin } from "#core/functions/pages-plugin.function";

const PAGES = [
  { html: ".stackra/index.html", path: "/" },
  { html: ".stackra/ar/index.html", path: "/ar/" },
  { html: ".stackra/ar-sa/index.html", path: "/ar-sa/" },
];

/** The URL the dev middleware leaves on a request. */
function served(url: string, accept = "text/html,application/xhtml+xml", method = "GET"): string {
  let middleware: ((request: unknown, response: unknown, next: () => void) => void) | undefined;
  const configureServer = pagesPlugin(PAGES).configureServer as (server: unknown) => void;
  configureServer({
    middlewares: {
      use(handler: typeof middleware) {
        middleware = handler;
      },
    },
  });
  const request = { url, method, headers: { accept } };
  const next = vi.fn();
  middleware?.(request, {}, next);
  expect(next).toHaveBeenCalledOnce();
  return request.url;
}

/** Runs the build hooks over `bundle` with the given base and returns the emitted files. */
function build(
  bundle: Record<string, { type: string; source: string }>,
  base: string,
): { fileName: string; source: string }[] {
  const plugin = pagesPlugin(PAGES);
  (plugin.configResolved as (config: { base: string }) => void)({ base });
  const hook = plugin.generateBundle as { handler: (this: unknown, ...args: unknown[]) => void };
  const emitted: { fileName: string; source: string }[] = [];
  hook.handler.call(
    {
      emitFile(file: { fileName: string; source: string }) {
        emitted.push(file);
      },
    },
    {},
    bundle,
  );
  return emitted;
}

describe("pagesPlugin", () => {
  it("serves each navigation from the page of its longest matching prefix", () => {
    expect(served("/orders?page=2")).toBe("/.stackra/index.html");
    expect(served("/ar/orders")).toBe("/.stackra/ar/index.html");
    expect(served("/ar-sa/orders")).toBe("/.stackra/ar-sa/index.html");
    expect(served("/ar-sa")).toBe("/.stackra/ar-sa/index.html");
  });

  it("leaves module, asset and non-GET requests alone", () => {
    expect(served("/src/main.ts", "*/*")).toBe("/src/main.ts");
    expect(served("/ar/orders", "text/html", "POST")).toBe("/ar/orders");
  });

  it("moves each built page to its prefix", () => {
    const bundle = {
      ".stackra/index.html": { type: "asset", source: '<script src="/assets/a.js"></script>' },
      ".stackra/ar/index.html": { type: "asset", source: '<script src="/assets/a.js"></script>' },
      "assets/a.js": { type: "chunk", source: "" },
    };
    const emitted = build(bundle, "/");
    expect(emitted).toEqual([
      { type: "asset", fileName: "index.html", source: '<script src="/assets/a.js"></script>' },
      { type: "asset", fileName: "ar/index.html", source: '<script src="/assets/a.js"></script>' },
    ]);
    expect(Object.keys(bundle)).toEqual(["assets/a.js"]);
  });

  it("keeps relative asset URLs pointing at the same files under a relative base", () => {
    const emitted = build(
      {
        ".stackra/index.html": { type: "asset", source: '<link href="../assets/a.css">' },
        ".stackra/ar/index.html": { type: "asset", source: '<script src="../../assets/a.js">' },
      },
      "./",
    );
    expect(emitted.map(({ source }) => source)).toEqual([
      '<link href="./assets/a.css">',
      '<script src="../assets/a.js">',
    ]);
  });

  it("applies to the client environment only", () => {
    const applies = pagesPlugin(PAGES).applyToEnvironment as (environment: unknown) => boolean;
    expect(applies({ config: { consumer: "client" } })).toBe(true);
    expect(applies({ config: { consumer: "server" } })).toBe(false);
  });
});
