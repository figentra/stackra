/**
 * Stackra file contract:
 * Purpose: unit tests of `emitSdks`: no file when no action is public; for a public action, the TypeScript, Python and
 *          PHP clients with one method each (its key, method and path), the reachable input types in TypeScript, the
 *          bearer token, `Stackra-Version` and `Idempotency-Key` headers, and nothing for an action not marked public;
 *          the emitted TypeScript client run against a fake `fetch` (a base-URL path prefix kept, a generated UUID key
 *          on a write with no key, the caller's key kept, no key on a `GET` even when passed one), and the Python and
 *          PHP key generated in `call` before the request.
 * Boundary: test only; runs on the manifest built from the commerce IR fixture, with one action marked public (and the
 *           list query too for the run); the TypeScript client is transpiled with `typescript6` and evaluated in a
 *           function scope; the Python and PHP text is asserted, not run.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); OS ADR 0039 (decisions 2 and 3); ADR 0217; ADR 0118; ADR 0136
 *                     (decision 3); ADR 0140.
 */
import { createRequire } from "node:module";
import { runInThisContext } from "node:vm";

import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitSdks } from "#core/functions/emit-sdks.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The parts of the typescript 6 module the run uses. */
interface Transpiler {
  readonly ModuleKind: { readonly CommonJS: number };
  readonly ScriptTarget: { readonly ES2022: number };
  transpileModule: (
    source: string,
    options: { compilerOptions: { module: number; target: number } },
  ) => { outputText: string };
}

/** The emitted client, as the run calls it. */
type Client = Record<
  "ordersOrderCancel" | "ordersOrderList",
  (input: object, options?: { idempotencyKey?: string }) => Promise<unknown>
>;

/** One request the fake `fetch` saw. */
interface Seen {
  readonly url: string;
  readonly method: string;
  readonly headers: Record<string, string>;
}

/** A client of the emitted TypeScript SDK `source` on `baseUrl`, and the requests its fake `fetch` sees. */
function run(source: string, baseUrl: string): { client: Client; seen: Seen[] } {
  const ts = createRequire(import.meta.url)("typescript6") as Transpiler;
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports: Record<string, unknown> = {};
  (runInThisContext(`(function (exports) {\n${outputText}\n})`) as (target: object) => void)(
    exports,
  );
  const seen: Seen[] = [];
  const fake = (url: URL, init: { method: string; headers: Record<string, string> }) => {
    seen.push({ url: String(url), method: init.method, headers: init.headers });
    return Promise.resolve(new Response(null, { status: 204 }));
  };
  const Constructor = exports["CommerceClient"] as new (options: object) => Client;
  return { client: new Constructor({ baseUrl, fetch: fake }), seen };
}

const UUID = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;

describe("emitSdks", () => {
  const { manifest } = buildManifest(COMMERCE_IR);
  const published: StackraManifest = {
    ...manifest,
    actions: (manifest.actions ?? []).map((action) =>
      action.key === "orders.order.cancel@1" ? { ...action, public: true } : action,
    ),
  };
  const files = emitSdks(published);
  const content = (path: string): string => files.find((file) => file.path === path)?.content ?? "";

  it("writes nothing when no action is public", () => {
    expect(emitSdks(manifest)).toEqual([]);
  });

  it("writes the three clients", () => {
    expect(files.map((file) => file.path)).toEqual([
      ".stackra/sdks/typescript/index.ts",
      ".stackra/sdks/python/commerce_client.py",
      ".stackra/sdks/php/CommerceClient.php",
    ]);
  });

  it("types the TypeScript client and sends the headers", () => {
    const ts = content(".stackra/sdks/typescript/index.ts");
    expect(ts).toContain("export type CancelOrderInput = {");
    expect(ts).toContain("export class CommerceClient {");
    expect(ts).toContain("ordersOrderCancel(input: CancelOrderInput, options: CallOptions = {})");
    expect(ts).toContain('"PUT", "/orders/:orderId/cancel", ["orderId"]');
    expect(ts).toContain('headers["stackra-version"]');
    expect(ts).toContain('headers["idempotency-key"]');
    expect(ts).not.toContain("ordersOrderList");
  });

  it("writes the Python and PHP methods", () => {
    expect(content(".stackra/sdks/python/commerce_client.py")).toContain(
      "def orders_order_cancel(self, input: dict, idempotency_key: str | None = None):",
    );
    const php = content(".stackra/sdks/php/CommerceClient.php");
    expect(php).toContain("namespace Stackra\\Sdk\\Commerce;");
    expect(php).toContain(
      "public function ordersOrderCancel(array $input, ?string $idempotencyKey = null): mixed",
    );
    expect(php).toContain("'PUT', '/orders/:orderId/cancel', ['orderId']");
  });

  describe("the TypeScript client, run", () => {
    const both: StackraManifest = {
      ...published,
      actions: (published.actions ?? []).map((action) =>
        action.key === "orders.order.list@1" ? { ...action, public: true } : action,
      ),
    };
    const source = emitSdks(both)[0]?.content ?? "";

    it("keeps the base-URL path prefix, with or without a trailing slash", async () => {
      for (const baseUrl of ["https://example.com/api", "https://example.com/api/"]) {
        const { client, seen } = run(source, baseUrl);
        await client.ordersOrderCancel({ orderId: "ord_1" });
        expect(seen[0]?.url).toBe("https://example.com/api/orders/ord_1/cancel");
      }
    });

    it("requests the same URL as before for a host-only base URL", async () => {
      const { client, seen } = run(source, "https://api.example.com");
      await client.ordersOrderCancel({ orderId: "ord_1" });
      expect(seen[0]?.url).toBe("https://api.example.com/orders/ord_1/cancel");
    });

    it("generates a fresh UUID key on a write with no key", async () => {
      const { client, seen } = run(source, "https://api.example.com");
      await client.ordersOrderCancel({ orderId: "ord_1" });
      await client.ordersOrderCancel({ orderId: "ord_1" });
      const keys = seen.map((request) => request.headers["idempotency-key"] ?? "");
      expect(keys[0]).toMatch(UUID);
      expect(keys[1]).toMatch(UUID);
      expect(keys[0]).not.toBe(keys[1]);
    });

    it("sends the caller's key unchanged, and none on a GET, even one passed a key", async () => {
      const { client, seen } = run(source, "https://api.example.com");
      await client.ordersOrderCancel({ orderId: "ord_1" }, { idempotencyKey: "replay-1" });
      await client.ordersOrderList({});
      await client.ordersOrderList({}, { idempotencyKey: "replay-2" });
      expect(seen[0]?.headers["idempotency-key"]).toBe("replay-1");
      expect(seen[1]?.method).toBe("GET");
      expect(seen[1]?.headers).not.toHaveProperty("idempotency-key");
      expect(seen[2]?.method).toBe("GET");
      expect(seen[2]?.headers).not.toHaveProperty("idempotency-key");
    });
  });

  it("generates the Python and PHP key in call, before the request", () => {
    const python = content(".stackra/sdks/python/commerce_client.py");
    expect(python).toContain("import uuid");
    expect(python).toContain('        self.base_url = base_url.rstrip("/")');
    expect(python).toContain(
      '        if method == "GET":\n            idempotency_key = None\n        elif idempotency_key is None:\n            idempotency_key = str(uuid.uuid4())',
    );
    expect(python.indexOf("uuid.uuid4()")).toBeLessThan(python.indexOf("urllib.request.Request("));
    const php = content(".stackra/sdks/php/CommerceClient.php");
    expect(php).toContain("$url = rtrim($this->baseUrl, '/') . $path;");
    expect(php).toContain(
      "if ($method === 'GET') {\n            $idempotencyKey = null;\n        } elseif ($idempotencyKey === null) {",
    );
    expect(php).toContain("random_bytes(16)");
    expect(php.indexOf("random_bytes(16)")).toBeLessThan(php.indexOf("file_get_contents("));
  });

  it("is deterministic", () => {
    expect(emitSdks(published)).toEqual(files);
  });
});
