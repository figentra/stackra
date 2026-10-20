import { describe, expect, it } from "vitest";
import { hiB } from "./api";
describe("B", () => { it("resolves DI in handler", async () => { expect((await hiB({ name: "x" })).msg).toBe("hi x @t0"); }); });
