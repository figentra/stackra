/**
 * Stackra file contract:
 * Purpose: unit tests of `googleWalletObject`: ids from the issuer, the kind's class and the serial, localized title
 *          and header, fields as text modules shown through `labels`, barcode, colour, logo and validity end, and the
 *          refusal of an id character Google Wallet does not take.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { googleWalletObject } from "#node/pass/google-wallet-object.function";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

const options = {
  issuerId: "3388000000012345678",
  serviceAccountEmail: "wallet@example.iam.gserviceaccount.com",
  classes: { loyalty_card: "loyalty" },
};

const request: WalletPassRequest = {
  kind: "loyalty_card",
  locale: "ar",
  issuedAt: new Date("2026-10-27T10:00:00Z"),
  labels: { "k::points": "النقاط" },
  content: {
    serial: "lya_1",
    title: "Acme",
    fields: [{ label: "k::points", value: "120" }],
    barcode: { format: "code128", value: "lya_1" },
    colors: { background: "#112233", foreground: "#ffffff" },
    logo: "https://cdn.example.com/logo.png" as never,
    validUntil: new Date("2027-01-01T00:00:00Z"),
  },
};

describe("googleWalletObject", () => {
  it("builds the generic object", () => {
    expect(googleWalletObject(request, options)).toEqual({
      id: "3388000000012345678.lya_1",
      classId: "3388000000012345678.loyalty",
      state: "ACTIVE",
      cardTitle: { defaultValue: { language: "ar", value: "Acme" } },
      header: { defaultValue: { language: "ar", value: "Acme" } },
      textModulesData: [{ id: "field_0", header: "النقاط", body: "120" }],
      barcode: { type: "CODE_128", value: "lya_1" },
      hexBackgroundColor: "#112233",
      logo: { sourceUri: { uri: "https://cdn.example.com/logo.png" } },
      validTimeInterval: { end: { date: "2027-01-01T00:00:00.000Z" } },
    });
  });

  it("uses the kind as class when none is listed", () => {
    expect(googleWalletObject({ ...request, kind: "award" }, options).classId).toBe(
      "3388000000012345678.award",
    );
  });

  it("refuses a serial Google Wallet ids cannot hold", () => {
    const content = { ...request.content, serial: "lya 1" };
    expect(() => googleWalletObject({ ...request, content }, options)).toThrow(TypeError);
  });
});
