/**
 * Stackra file contract:
 * Purpose: proves `cataloguesPlugin` resolves `virtual:playground-catalogues` and serves every
 *          `assets/lang/<locale>/<namespace>.json` of the playground as one module, by locale and namespace.
 * Boundary: the plugin's hooks called directly over the real catalogue folder; no server.
 * Runtime: node
 * Governing contract: STA-1371 (playground dev speed); ADR 0022 (test placement).
 */
// @vitest-environment node
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { cataloguesPlugin } from "../catalogues.plugin";

/** Calls a plugin hook that may be a function or an object with a handler. */
// oxlint-disable-next-line typescript/no-explicit-any -- Vite's hook types are unions of function and object forms
const call = (hook: any, ...args: unknown[]): unknown =>
  (typeof hook === "function" ? hook : hook.handler).call({}, ...args);

describe("cataloguesPlugin", () => {
  const plugin = cataloguesPlugin();
  const resolved = call(plugin.resolveId, "virtual:playground-catalogues") as string;

  it("resolves the virtual id only", () => {
    expect(resolved).toBe("\0virtual:playground-catalogues");
    expect(call(plugin.resolveId, "react")).toBeUndefined();
  });

  it("serves every catalogue by locale and namespace", () => {
    const code = call(plugin.load, resolved) as string;
    const prefix = "export default JSON.parse(";
    expect(code.startsWith(prefix)).toBe(true);
    // The module is one JSON string literal parsed at load; reading it back twice gives the object it serves.
    const catalogues = {
      default: JSON.parse(JSON.parse(code.slice(prefix.length, -");".length)) as string) as Record<
        string,
        Record<string, unknown>
      >,
    };
    const dir = fileURLToPath(new URL("../../assets/lang/en", import.meta.url));
    expect(Object.keys(catalogues.default)).toEqual(expect.arrayContaining(["en", "ar"]));
    expect(new Set(Object.keys(catalogues.default["en"] ?? {}))).toEqual(
      new Set(
        readdirSync(dir)
          .filter((file) => file.endsWith(".json"))
          .map((file) => file.slice(0, -".json".length)),
      ),
    );
    expect(catalogues.default["en"]?.["shell"]).toBeTypeOf("object");
  });
});
