/**
 * Stackra file contract:
 * Purpose: `Seeder`, the kind base of a seed profile in `database/seeders/`: `run()` writes the rows of one profile
 *          (`minimal`, `demo` or `test`, the file name) for one module.
 * Boundary: a bare-only kind base, registered as `seeder`. The identity is `<module>.<profile>` (gen derives it); the
 *           public ids a seeder creates are declared once in its `static ids`. `stackra db seed` and the testing
 *           module's `.seed(...)` run it in one transaction; a `minimal` seeder imports no factory.
 * Runtime: node
 * Governing contract: ADR 0190 as amended by ADR 0294 (profiles, identities, `ids`); ADR 0294 (decision 25).
 */
import { registerKind } from "@stackra/container";

/**
 * The base of every seeder.
 *
 * @example
 * export class InventoryDemoSeeder extends Seeder {
 *   static readonly ids = { mediumTee: "stk_01JA0000000000000000000001" } as const;
 *
 *   async run(): Promise<void> {
 *     await StockLevelFactory.new().create({ id: InventoryDemoSeeder.ids.mediumTee, onHand: 50 });
 *   }
 * }
 */
export abstract class Seeder {
  /** Type-only kind brand, so a class of another kind cannot stand in for a seeder. */
  declare readonly "~kind": "seeder";

  /** Writes the profile's rows; runs inside the caller's transaction. */
  abstract run(): Promise<void>;
}

registerKind(Seeder, "seeder");
