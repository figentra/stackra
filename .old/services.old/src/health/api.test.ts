import { check } from "./api";

describe("health.check", () => {
  it("reports ok", async () => {
    expect(await check()).toEqual({ status: "ok" });
  });
});
