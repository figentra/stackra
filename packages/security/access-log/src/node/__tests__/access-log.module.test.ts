/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogModule`: a module whose one export is `AccessLogService`.
 * Boundary: test only; reads the module's recorded options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 12 and 16).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { AccessLogService } from "#core/services/access-log.service";
import { AccessLogModule } from "#node/access-log.module";

describe("AccessLogModule", () => {
  it("is a module that exports AccessLogService only", () => {
    expect(kindOf(AccessLogModule)?.kind).toBe("module");
    expect(kindOf(AccessLogModule)?.options["exports"]).toEqual([AccessLogService]);
  });
});
