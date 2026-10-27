/**
 * Stackra file contract:
 * Purpose: unit tests of `applePassJson`: identifiers and serial, colours as `rgb()`, the barcode, the expiry, the
 *          style from the kind, the field split, and labels shown through the request's `labels`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { applePassJson } from "#node/pass/apple-pass-json.function";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

const options = {
  passTypeIdentifier: "pass.com.example.loyalty",
  teamIdentifier: "TEAM123456",
  organizationName: "Acme",
  styles: { loyalty_card: "storeCard" as const },
};

const request: WalletPassRequest = {
  kind: "loyalty_card",
  locale: "en",
  issuedAt: new Date("2026-10-27T10:00:00Z"),
  labels: { "loyalty_kit::passes.loyalty_card.points": "Points" },
  content: {
    serial: "lya_1",
    title: "Acme Rewards",
    subtitle: "Gold",
    fields: [
      { label: "loyalty_kit::passes.loyalty_card.points", value: "120" },
      ...Array.from({ length: 5 }, (_, index) => ({ label: `L${index}`, value: `V${index}` })),
    ],
    barcode: { format: "qr", value: "lya_1" },
    colors: { background: "#112233", foreground: "#ffffff" },
    validUntil: new Date("2027-01-01T00:00:00Z"),
  },
};

describe("applePassJson", () => {
  it("writes the identifiers, colours, barcode and expiry", () => {
    const json = applePassJson(request, options);
    expect(json).toMatchObject({
      formatVersion: 1,
      passTypeIdentifier: "pass.com.example.loyalty",
      teamIdentifier: "TEAM123456",
      serialNumber: "lya_1",
      backgroundColor: "rgb(17, 34, 51)",
      foregroundColor: "rgb(255, 255, 255)",
      barcodes: [{ format: "PKBarcodeFormatQR", message: "lya_1", messageEncoding: "iso-8859-1" }],
      expirationDate: "2027-01-01T00:00:00.000Z",
    });
  });

  it("splits the fields of the kind's style and shows labels", () => {
    const style = applePassJson(request, options)["storeCard"] as Record<string, unknown[]>;
    expect(style["primaryFields"]).toEqual([{ key: "field_0", label: "Points", value: "120" }]);
    expect(style["secondaryFields"]).toHaveLength(4);
    expect(style["backFields"]).toEqual([{ key: "field_5", label: "L4", value: "V4" }]);
    expect(style["headerFields"]).toEqual([{ key: "subtitle", label: "", value: "Gold" }]);
  });

  it("uses the generic style for a kind not listed", () => {
    expect(applePassJson({ ...request, kind: "award" }, options)).toHaveProperty("generic");
  });

  it("refuses a colour that is not #rrggbb", () => {
    const content = { ...request.content, colors: { background: "red", foreground: "#ffffff" } };
    expect(() => applePassJson({ ...request, content }, options)).toThrow(TypeError);
  });
});
