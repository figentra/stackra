/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the module, the Explorer, the Postgres sink, the model, the
 *          classification macro and the retention job with its input and output are its values; the migration and the
 *          factory are not.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/access-log/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "AccessLogEntry",
      "AccessLogEntryPermissions",
      "AccessLogExplorer",
      "AccessLogModule",
      "DataClassificationMacro",
      "PostgresAccessLogSinkDriver",
      "PurgeAccessLogAction",
      "PurgeAccessLogInput",
      "PurgeAccessLogOutput",
    ]);
  });
});
