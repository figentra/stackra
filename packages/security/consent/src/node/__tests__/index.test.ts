/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the consent endpoint action with its input and output and
 *          `ConsentSnapshotPermissions` are its values, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15); ADR 0472.
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/consent/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "ConsentSnapshotPermissions",
      "IssueConsentSnapshotAction",
      "IssueConsentSnapshotInput",
      "IssueConsentSnapshotOutput",
    ]);
  });
});
