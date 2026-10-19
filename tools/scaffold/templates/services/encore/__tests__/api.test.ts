import { status } from "../api";

describe("{{NAME}}.status", () => {
  it("reports ok", async () => {
    expect(await status()).toEqual({ service: "{{NAME}}", status: "ok" });
  });
});
