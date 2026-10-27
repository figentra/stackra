/**
 * Stackra file contract:
 * Purpose: unit tests of `AwardPass`: an `award` pass kind whose content carries the award id as serial, the verify
 *          URL as QR code, the level as subtitle, and the level, period, grant date and code as lang-keyed fields only
 *          when the award has them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 5).
 */
import { kindOf } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AwardPass } from "#node/integrations/award.pass";

const award = {
  awardId: "awd_00000000000000000000000001" as PublicId<"awd">,
  kindName: "Reading star",
  level: "gold",
  period: "2026-T1",
  grantedAt: new Date("2026-10-27T10:00:00Z"),
  verifyUrl: "https://verify.example.com/abc",
  verifyCode: "K7QF-29XM",
};

describe("AwardPass", () => {
  it("is the award pass kind", () => {
    expect(kindOf(AwardPass)).toEqual({ kind: "pass", options: { key: "award" } });
  });

  it("builds the pass from the certificate fields", () => {
    expect(new AwardPass().content(award)).toEqual({
      serial: "awd_00000000000000000000000001",
      title: "Reading star",
      subtitle: "gold",
      fields: [
        { label: "achievements::passes.award.level", value: "gold" },
        { label: "achievements::passes.award.period", value: "2026-T1" },
        { label: "achievements::passes.award.granted", value: "2026-10-27" },
        { label: "achievements::passes.award.code", value: "K7QF-29XM" },
      ],
      barcode: { format: "qr", value: "https://verify.example.com/abc" },
    });
  });

  it("leaves out what the award does not have", () => {
    const content = new AwardPass().content({
      ...award,
      level: null,
      period: null,
      verifyCode: null,
    });
    expect(content.subtitle).toBeUndefined();
    expect(content.fields).toEqual([
      { label: "achievements::passes.award.granted", value: "2026-10-27" },
    ]);
  });
});
