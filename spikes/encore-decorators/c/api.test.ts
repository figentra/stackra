import { describe, expect, it } from "vitest";
import { getItem } from "./generated";
describe("C", () => { it("controller via generated api", async () => { expect(await getItem({ id: "7" })).toEqual({ id: "7", name: "item-7" }); }); });
