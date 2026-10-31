/**
 * Stackra file contract:
 * Purpose: proves `library()` returns the agreed shape (ESM, dts, sourcemap, clean, treeshake), that its guard fails a
 *          chunk carrying rolldown's `__require` shim (STA-1722), and that the decorators
 *          flag installs the inputOptions hook which adds the legacy transform and swallows only the known conflict
 *          log.
 * Boundary: test only; imports the subject by relative path (a package cannot depend on itself).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0025 (build output); ADR 0005 (legacy decorators).
 */
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { library, type LibraryConfig } from "../index.ts";

type Resolved = {
  entry: Record<string, string>;
  format: string[];
  dts: unknown;
  sourcemap: unknown;
  clean: unknown;
  treeshake: unknown;
  inputOptions?: (i: Record<string, unknown>) => Record<string, unknown>;
  plugins: {
    name: string;
    renderChunk: (
      this: { error: (message: string) => never },
      code: string,
      chunk: { fileName: string },
    ) => { code: string; map: null } | null;
  }[];
};

describe("@stackra/tsdown-config library()", () => {
  it("returns LibraryConfig, a type a member can name through this package (TS2883, STA-1743)", () => {
    expectTypeOf(library()).toEqualTypeOf<LibraryConfig>();
  });

  it("defaults to the barrel entry and the agreed options", () => {
    const cfg = library() as unknown as Resolved;
    expect(cfg.entry).toEqual({ index: "src/index.ts" });
    expect(cfg.format).toEqual(["esm"]);
    expect(cfg.dts).toBe(true);
    expect(cfg.sourcemap).toBe(true);
    expect(cfg.clean).toBe(true);
    expect(cfg.treeshake).toBe(true);
    expect(cfg.inputOptions).toBeUndefined();
  });

  it("fails a chunk that calls a bundled require through rolldown's __require shim (STA-1722)", () => {
    const [guard] = (library() as unknown as Resolved).plugins;
    if (guard === undefined) throw new Error("no guard plugin");
    const context = {
      error: (message: string): never => {
        throw new Error(message);
      },
    };
    const chunk = { fileName: "active-view-id-of.function-ORsh_53L.mjs" };
    expect(() =>
      guard.renderChunk.call(context, 'var x = __require("react"); __require("react");', chunk),
    ).toThrow(/active-view-id-of\.function-ORsh_53L\.mjs calls require\("react"\) through/);
    expect(guard.renderChunk.call(context, 'import { useState } from "react";', chunk)).toBeNull();
  });

  it("rewrites a listed optional peer's shimmed require for Metro and fails any other (STA-1722)", () => {
    const [guard] = (
      library(undefined, { optionalRequires: ["expo-haptics"] }) as unknown as Resolved
    ).plugins;
    if (guard === undefined) throw new Error("no guard plugin");
    const context = {
      error: (message: string): never => {
        throw new Error(message);
      },
    };
    const chunk = { fileName: "native.mjs" };
    const shimmed = 'try { e = __require("expo-haptics"); } catch {}';
    const out = guard.renderChunk.call(context, shimmed, chunk);
    expect(out?.code).toBe('try { e = require  ("expo-haptics"); } catch {}');
    expect(out?.code.length).toBe(shimmed.length);
    expect(
      guard.renderChunk.call(context, 'try { e = require("expo-haptics"); } catch {}', chunk),
    ).toBeNull();
    expect(
      guard.renderChunk.call(context, 'x.require("react"); my_require("react");', chunk),
    ).toBeNull();
    expect(() => guard.renderChunk.call(context, 'var r = require("react");', chunk)).toThrow(
      /native\.mjs calls require\("react"\), which throws/,
    );
    expect(() =>
      guard.renderChunk.call(context, '__require("expo-haptics"); __require("react");', chunk),
    ).toThrow(/calls require\("react"\) through rolldown's __require shim/);
  });

  it("decorators: true adds the legacy transform (no metadata) and filters the duplicate-flag log", () => {
    const cfg = library({ index: "src/index.ts" }, { decorators: true }) as unknown as Resolved;
    expect(cfg.inputOptions).toBeTypeOf("function");
    if (!cfg.inputOptions) throw new Error("unreachable: asserted above");
    const out = cfg.inputOptions({ transform: { target: "es2022" } }) as {
      transform: {
        decorator: { legacy: boolean; emitDecoratorMetadata: boolean };
        target: string;
      };
      onLog: (
        level: string,
        log: { code: string; message: string },
        d: (...a: unknown[]) => void,
      ) => void;
    };
    expect(out.transform.decorator).toEqual({
      legacy: true,
      emitDecoratorMetadata: false,
    });
    expect(out.transform.target).toBe("es2022");
    const handler = vi.fn();
    out.onLog(
      "warn",
      {
        code: "CONFIGURATION_FIELD_CONFLICT",
        message: "`transform.decorator` set twice",
      },
      handler,
    );
    expect(handler).not.toHaveBeenCalled();
    out.onLog("warn", { code: "OTHER", message: "x" }, handler);
    expect(handler).toHaveBeenCalledOnce();
  });
});
