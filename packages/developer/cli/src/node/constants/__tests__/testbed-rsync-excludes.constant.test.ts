/**
 * Stackra file contract:
 * Purpose: unit test of `TESTBED_RSYNC_EXCLUDES`: the Mac's upload leaves out exactly what the testbed agent's seed
 *          refresh leaves out (`TESTBED_DEFAULTS.rsyncExcludes`), in the same order. Two lists that drift mean a job
 *          uploads a file the box then deletes, or the box keeps a file the Mac never sends (STA-2679, the dev secrets).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484 (the testbed); ADR 0282 (decision 3).
 */
import { TESTBED_DEFAULTS } from "@stackra/infra-testbed";
import { describe, expect, it } from "@stackra/testing";

import { TESTBED_RSYNC_EXCLUDES } from "#node/constants/testbed-rsync-excludes.constant";

describe("TESTBED_RSYNC_EXCLUDES", () => {
  it("is the testbed agent's rsync excludes, entry for entry", () => {
    expect(TESTBED_RSYNC_EXCLUDES).toEqual([...TESTBED_DEFAULTS.rsyncExcludes]);
  });
});
