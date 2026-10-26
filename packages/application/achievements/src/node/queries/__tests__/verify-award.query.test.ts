/**
 * Stackra file contract:
 * Purpose: unit tests of `VerifyAwardQuery`: the public `award.verify` query on its GET route, open to anonymous
 *          callers and not an MCP tool; it verifies by token or by code and answers `not_found` for neither match.
 * Boundary: test only; the award service is an in-test stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0432 (decisions 1 and 2).
 */
import { kindOf } from "@stackra/container";
import { ActorKind, ApiArea, HttpMethod, type PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import type { VerifiedAward } from "#contracts/index";
import { VerifyAwardQuery } from "#node/queries/verify-award.query";
import { VerifyAwardInput } from "#node/schemas/verify-award-input.schema";
import type { AwardService } from "#node/services/award.service";

const AWARD: VerifiedAward = {
  awardId: "awd_01j9z3k4m5n6p7q8r9s0t1v2w5" as PublicId<"awd">,
  kindId: "awk_01j9z3k4m5n6p7q8r9s0t1v2w6" as PublicId<"awk">,
  kindName: "Top seller",
  level: null,
  period: "2026-09",
  recipient: { model: "test.member", id: "mem_1" },
  grantedAt: new Date("2026-10-25T09:00:00Z"),
};

describe(VerifyAwardQuery, () => {
  it("is the public award.verify query on its GET route", () => {
    expect(kindOf(VerifyAwardQuery)?.options).toMatchObject({
      key: "award.verify",
      actors: [ActorKind.Anonymous, ActorKind.User, ActorKind.Service],
      area: ApiArea.Public,
      endpoint: { method: HttpMethod.Get, path: "/awards/verify" },
      tool: false,
    });
  });

  it("verifies by token or by code", async () => {
    const awards = {
      verify: vi.fn(async (token: string) => (token === "t" ? AWARD : null)),
      verifyCode: vi.fn(async (code: string) => (code === "7K3Q-9XPM-0ABZ" ? AWARD : null)),
    };
    const query = new VerifyAwardQuery(awards as unknown as AwardService);
    await expect(query.handle(VerifyAwardInput.create({ token: "t" }))).resolves.toMatchObject({
      status: "valid",
      award: AWARD,
    });
    await expect(
      query.handle(VerifyAwardInput.create({ code: "7K3Q-9XPM-0ABZ" })),
    ).resolves.toMatchObject({ status: "valid" });
    await expect(query.handle(VerifyAwardInput.create({ code: "nope" }))).resolves.toMatchObject({
      status: "not_found",
      award: null,
    });
  });

  it("takes the token or the code, not both or neither", () => {
    expect(() => VerifyAwardInput.create({})).toThrow();
    expect(() => VerifyAwardInput.create({ token: "t", code: "c" })).toThrow();
  });
});
