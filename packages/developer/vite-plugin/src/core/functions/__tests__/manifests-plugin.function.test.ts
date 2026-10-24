/**
 * Stackra file contract:
 * Purpose: unit tests of `manifestsPlugin`: the dev server answers `/<file name>` with the generated manifest and its
 *          media type, other requests pass through, the build emits each manifest at the root, and a missing manifest
 *          fails with what to run.
 * Boundary: test only; writes a throwaway member in the OS temp directory and calls the hooks directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0255.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { manifestsPlugin } from "#core/functions/manifests-plugin.function";

const FILES = [".stackra/pwa/manifest.en.webmanifest", ".stackra/pwa/manifest.ar-sa.webmanifest"];

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "stackra-vite-"));
  mkdirSync(join(root, ".stackra", "pwa"), { recursive: true });
  writeFileSync(join(root, FILES[0] ?? ""), '{"lang":"en"}');
  writeFileSync(join(root, FILES[1] ?? ""), '{"lang":"ar-SA"}');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** The plugin with its root set. */
function plugin(files: readonly string[] = FILES): ReturnType<typeof manifestsPlugin> {
  const created = manifestsPlugin(files);
  (created.configResolved as (config: { root: string }) => void)({ root });
  return created;
}

describe("manifestsPlugin", () => {
  it("serves each manifest at the root under its file name", () => {
    let middleware: ((request: unknown, response: unknown, next: () => void) => void) | undefined;
    (plugin().configureServer as (server: unknown) => void)({
      middlewares: {
        use(handler: typeof middleware) {
          middleware = handler;
        },
      },
    });
    const response = { setHeader: vi.fn(), end: vi.fn() };
    const next = vi.fn();
    middleware?.({ url: "/manifest.ar-sa.webmanifest" }, response, next);
    expect(response.setHeader).toHaveBeenCalledWith("Content-Type", "application/manifest+json");
    expect(String(response.end.mock.calls[0]?.[0])).toBe('{"lang":"ar-SA"}');
    expect(next).not.toHaveBeenCalled();

    middleware?.({ url: "/orders" }, response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("emits each manifest at the root of the build", () => {
    const emitFile = vi.fn();
    const generateBundle = plugin().generateBundle as (this: unknown) => void;
    generateBundle.call({ emitFile, error: vi.fn() });
    expect(emitFile.mock.calls.map(([file]) => [file.fileName, String(file.source)])).toEqual([
      ["manifest.en.webmanifest", '{"lang":"en"}'],
      ["manifest.ar-sa.webmanifest", '{"lang":"ar-SA"}'],
    ]);
  });

  it("fails a missing manifest, saying to run stackra gen", () => {
    const generateBundle = plugin([".stackra/pwa/manifest.ar.webmanifest"]).generateBundle as (
      this: unknown,
    ) => void;
    const context = {
      emitFile: vi.fn(),
      error(message: string): never {
        throw new Error(message);
      },
    };
    expect(() => generateBundle.call(context)).toThrow(/run `stackra gen`/);
  });
});
