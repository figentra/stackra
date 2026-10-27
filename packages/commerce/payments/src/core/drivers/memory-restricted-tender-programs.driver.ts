/**
 * Stackra file contract:
 * Purpose: `MemoryRestrictedTenderProgramsDriver`, an in-memory `RestrictedTenderPrograms` for tests and development:
 *          programs set per Market by the test.
 * Boundary: the memory driver every port ships before its durable one (ADR 0266); its name is the file prefix
 *           (`memory`). Isomorphic, so it ships from the `.` entry. Production reads pack data (the `market-pack`
 *           driver in ./node).
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0266 (decision 2); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { RestrictedTenderPrograms } from "#contracts/ports/restricted-tender-programs.port";
import type { RestrictedTenderProgram } from "#contracts/types/restricted-tender-program.type";

/**
 * Programs in a Map.
 *
 * @example
 * const programs = new MemoryRestrictedTenderProgramsDriver().offer("us", snap);
 */
export class MemoryRestrictedTenderProgramsDriver extends Driver(RestrictedTenderPrograms) {
  /** Programs by `<market>:<code>`. */
  private readonly programs = new Map<string, RestrictedTenderProgram>();

  /** Makes `market` offer `program`, replacing one with the same code; returns this driver. */
  offer(market: string, program: RestrictedTenderProgram): this {
    this.programs.set(`${market}:${program.code}`, program);
    return this;
  }

  /** Program `code` of `market`, or undefined. */
  async program(market: string, code: string): Promise<RestrictedTenderProgram | undefined> {
    return this.programs.get(`${market}:${code}`);
  }
}
