import { describe, expect, it } from "vitest";
import { hiA } from "./api";
describe("A", () => { it("resolves DI in handler", async () => { expect((await hiA({ name: "x" })).msg).toBe("hi x @t0"); }); });
