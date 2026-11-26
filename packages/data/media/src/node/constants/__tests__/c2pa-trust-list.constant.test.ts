/**
 * Stackra file contract:
 * Purpose: unit tests of `C2PA_TRUST_LIST`: the pinned copy is the upstream file byte for byte (its SHA-256 is the
 *          pin's), every block in it is a certificate authority that parses, and the pin names a commit and its file.
 * Boundary: test only; pure over the constant, no network (the upstream check is `curl -fsSL <source> | sha256sum`).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; STA-2791 (CTO decision of 2026-11-25: the trust list pinned, updated by PR).
 */
import { createHash } from "node:crypto";

import { describe, expect, it } from "@stackra/testing";

import { C2PA_TRUST_LIST } from "#node/constants/c2pa-trust-list.constant";
import { C2PA_TRUST_LIST_PIN } from "#node/constants/c2pa-trust-list-pin.constant";
import { certificatesIn } from "#node/functions/certificates-in.function";

describe("C2PA_TRUST_LIST", () => {
  it("is the pinned upstream file, unchanged", () => {
    expect(createHash("sha256").update(C2PA_TRUST_LIST, "utf8").digest("hex")).toBe(
      C2PA_TRUST_LIST_PIN.sha256,
    );
    expect(C2PA_TRUST_LIST_PIN.source).toBe(
      `https://raw.githubusercontent.com/c2pa-org/conformance-public/${C2PA_TRUST_LIST_PIN.commit}/trust-list/C2PA-TRUST-LIST.pem`,
    );
  });

  it("holds only certificate authorities, every one readable", () => {
    const blocks = C2PA_TRUST_LIST.match(/-----BEGIN CERTIFICATE-----/g) ?? [];
    const anchors = certificatesIn(C2PA_TRUST_LIST);
    expect(anchors.length).toBeGreaterThan(0);
    expect(anchors).toHaveLength(blocks.length);
    expect(anchors.every(({ ca }) => ca)).toBe(true);
  });
});
