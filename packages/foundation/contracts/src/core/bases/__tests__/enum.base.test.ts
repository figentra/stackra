/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Enum`: cases are plain frozen codes, `values` keeps source order and returns a
 *          fresh array, `meta` returns the frozen data of a case, and the guards refuse empty and duplicate codes,
 *          unknown codes and foreign objects.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 16).
 */
import { describe, expect, it } from "@stackra/testing";

import { Enum } from "#core/bases/enum.base";

const Status = Enum.of({
  Queued: ["queued", { tone: "warning", rank: 1 }],
  Sent: ["sent", { tone: "success", rank: 2 }],
  Failed: "failed",
});
type Status = Enum.Value<typeof Status>;

describe("Enum", () => {
  it("makes each case its plain code, so cases compare with ===", () => {
    expect(Status.Queued).toBe("queued");
    expect(Status.Sent).toBe("sent");
    expect(Status.Failed).toBe("failed");
    expect(Object.keys(Status)).toEqual(["Queued", "Sent", "Failed"]);
  });

  it("freezes the enum object and keeps no case data on it", () => {
    expect(Object.isFrozen(Status)).toBe(true);
    expect("~enum" in Status).toBe(false);
  });

  it("lists the codes in source order, as a new array each time", () => {
    const first = Enum.values(Status);
    expect(first).toEqual(["queued", "sent", "failed"]);
    first.pop();
    expect(Enum.values(Status)).toEqual(["queued", "sent", "failed"]);
  });

  it("reads the data of a case, and {} for a bare code", () => {
    expect(Enum.meta(Status, Status.Sent)).toEqual({ tone: "success", rank: 2 });
    expect(Enum.meta(Status, Status.Failed)).toEqual({});
  });

  it("copies and freezes case data, so a later change to the source object does not leak in", () => {
    const data = { multiplier: 100 };
    const Tier = Enum.of({ Bronze: ["bronze", data] });
    data.multiplier = 999;
    const meta = Enum.meta(Tier, Tier.Bronze);
    expect(meta.multiplier).toBe(100);
    expect(Object.isFrozen(meta)).toBe(true);
  });

  it("refuses an empty code and a code used twice", () => {
    expect(() => Enum.of({ Blank: "" })).toThrow(RangeError);
    expect(() => Enum.of({ First: "same", Second: ["same", { n: 1 }] })).toThrow(
      /more than one case/,
    );
  });

  it("refuses an unknown code, which only unvalidated data can carry", () => {
    expect(() => Enum.meta(Status, "lost" as Status)).toThrow(RangeError);
  });

  it("refuses an object that Enum.of did not build", () => {
    const forged = { "~enum": {} } as Enum.Any;
    expect(() => Enum.values(forged)).toThrow(TypeError);
  });

  it("types the codes as a union and the data per code", () => {
    const status: Status = Status.Sent;
    // @ts-expect-error -- "lost" is not a code of Status
    const wrong: Status = "lost";
    const rank: 1 | 2 = Enum.meta(Status, Status.Queued).rank;
    const codes: Status[] = Enum.values(Status);
    expect([status, wrong, rank, codes.length]).toEqual(["sent", "lost", 1, 3]);
  });
});
