/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./node` entry: the core stack program, each of its parts and the `ref:`
 *          resolver are exported, and nothing else is.
 * Boundary: test only; imports the stand-in barrel through its `#node` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as node from "#node/index";

describe("@stackra/infra-cloudflare/node", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(node).sort()).toEqual([
      "accessGate",
      "cloudflareCoreStack",
      "cloudflareZone",
      "devTunnel",
      "r2Bucket",
      "resolveRef",
      "zoneEdge",
    ]);
  });
});
