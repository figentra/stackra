import { {{PASCAL}}Error } from "../{{NAME}}-error";
import { create{{PASCAL}}Record } from "../{{NAME}}-record";

describe("create{{PASCAL}}Record", () => {
  it("trims the label and freezes the record", () => {
    const record = create{{PASCAL}}Record({ id: "r1", label: "  First  " });

    expect(record).toEqual({ id: "r1", label: "First" });
    expect(Object.isFrozen(record)).toBe(true);
  });

  it("rejects an empty id", () => {
    expect(() => create{{PASCAL}}Record({ id: "", label: "First" })).toThrow({{PASCAL}}Error);
  });

  it("rejects a blank label", () => {
    expect(() => create{{PASCAL}}Record({ id: "r1", label: "   " })).toThrow(
      "A {{NAME}} record needs a non-empty label.",
    );
  });

  it("names its error class", () => {
    expect(new {{PASCAL}}Error("x").name).toBe("{{PASCAL}}Error");
  });
});
