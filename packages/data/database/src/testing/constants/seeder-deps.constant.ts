/**
 * Stackra file contract:
 * Purpose: `SEEDER_DEPS`, the constructor tokens of each seeder the member's test setup registered
 *          (`registerSeederDeps`), which `.seed()` resolves in the compiled app: a seeder is not a binding, so the
 *          wiring does not list them.
 * Boundary: process memory; filled once by the generated test setup, read by the testing plugin only.
 * Runtime: node
 * Governing contract: ADR 0190; ADR 0263 (constructor injection by type); STA-1698.
 */
import type { AnyClass, Token } from "@stackra/container";

import type { Seeder } from "#core/bases/seeder.base";

/** The constructor tokens per seeder class. */
export const SEEDER_DEPS = new Map<AnyClass<Seeder>, readonly Token<object>[]>();
