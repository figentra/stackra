/**
 * Stackra file contract:
 * Purpose: unit tests of `Seeder`: a bare kind base registered as `seeder`; a subclass declares its ids once and
 *          writes its rows in `run()`.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0190 as amended by ADR 0294; ADR 0022; ADR 0269.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { Seeder } from "#core/bases/seeder.base";

describe("Seeder", () => {
  it("runs a subclass's rows", async () => {
    const written: string[] = [];
    class CatalogueDemoSeeder extends Seeder {
      static readonly ids = { tee: "prd_01JA0000000000000000000001" } as const;

      async run(): Promise<void> {
        written.push(CatalogueDemoSeeder.ids.tee);
        await Promise.resolve();
      }
    }
    await new CatalogueDemoSeeder().run();
    expect(kindOf(CatalogueDemoSeeder)?.kind).toBe("seeder");
    expect(written).toEqual(["prd_01JA0000000000000000000001"]);
  });
});
