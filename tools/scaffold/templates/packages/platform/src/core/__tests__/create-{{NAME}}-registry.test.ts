import { create{{PASCAL}}Registry } from "../create-{{NAME}}-registry";

describe("create{{PASCAL}}Registry", () => {
  it("resolves a value under its key", () => {
    const registry = create{{PASCAL}}Registry<number>();
    registry.register("answer", 42);

    expect(registry.has("answer")).toBe(true);
    expect(registry.resolve("answer")).toBe(42);
  });

  it("throws on a duplicate key", () => {
    const registry = create{{PASCAL}}Registry<number>();
    registry.register("answer", 42);

    expect(() => registry.register("answer", 7)).toThrow("already registered: answer");
  });

  it("throws on an unknown key", () => {
    expect(() => create{{PASCAL}}Registry<number>().resolve("missing")).toThrow(
      "not registered: missing",
    );
  });
});
