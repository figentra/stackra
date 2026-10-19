import { hello } from "./api";

describe("example.hello", () => {
  it("greets and reaches health through the generated client", async () => {
    expect(await hello({ name: " Ada " })).toEqual({ message: "Hello, Ada!", upstream: "ok" });
  });

  it("rejects a blank name", async () => {
    await expect(hello({ name: "  " })).rejects.toThrow("name is required");
  });
});
