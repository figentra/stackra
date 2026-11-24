/**
 * Stackra file contract:
 * Purpose: unit tests of `PingQuery`: `health.ping.check@1` admits only the platform actor, has no endpoint and is no
 *          tool, and answers `up`.
 * Boundary: test only; the query is called directly with a fake context. The pipeline's steps are the pipeline
 *           indicator's test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098; ADR 0190 (health).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind, HealthStatus } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PingQuery } from "#modules/health/queries/ping.query";
import { PingInput } from "#modules/health/schemas/ping-input.schema";

/** The ping query. */
describe(PingQuery, () => {
  /** Only the platform calls it, and nothing exposes it. */
  it("is for the system actor only, with no endpoint and no tool", () => {
    expect(kindOf(PingQuery)?.options).toMatchObject({
      key: "ping.check",
      actors: [ActorKind.System],
      endpoint: false,
      tool: false,
    });
  });

  /** It answers up. */
  it("answers up", async () => {
    const output = await new PingQuery().handle(PingInput.create({}), fakeActionContext() as never);
    expect({ ...output }).toEqual({ status: HealthStatus.Up });
  });
});
