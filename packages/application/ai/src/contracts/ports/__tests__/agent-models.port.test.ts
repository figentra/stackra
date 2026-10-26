/**
 * Stackra file contract:
 * Purpose: unit tests of the `AgentModels` port: an abstract port class a driver extends, never constructed bare.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0100 (decision 10); STA-781.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AgentModels } from "#contracts/ports/agent-models.port";

describe("AgentModels", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(AgentModels)).toBe(Port);
    expect(AgentModels.name).toBe("AgentModels");
  });
});
