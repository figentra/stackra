/**
 * Stackra file contract:
 * Purpose: unit tests of `emitSdks`: no file when no action is public; for a public action, the TypeScript, Python and
 *          PHP clients with one method each (its key, method and path), the reachable input types in TypeScript, the
 *          bearer token, `Stackra-Version` and `Idempotency-Key` headers, and nothing for an action not marked public.
 * Boundary: test only; runs on the manifest built from the commerce IR fixture, with one action marked public.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); OS ADR 0039 (decisions 2 and 3); ADR 0217; ADR 0118; ADR 0140.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { buildManifest } from "#core/functions/build-manifest.function";
import { emitSdks } from "#core/functions/emit-sdks.function";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

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

  it("is deterministic", () => {
    expect(emitSdks(published)).toEqual(files);
  });
});
