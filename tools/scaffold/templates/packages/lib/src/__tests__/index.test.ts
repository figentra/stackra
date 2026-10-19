import { format{{PASCAL}}Label } from "..";

describe("@stackra/{{NAME}}", () => {
  it("formats a label through the public entry", () => {
    expect(format{{PASCAL}}Label("  a   b ")).toBe("a b");
  });
});
