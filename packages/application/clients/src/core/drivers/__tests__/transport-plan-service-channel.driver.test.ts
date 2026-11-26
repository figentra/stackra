/**
 * Stackra file contract:
 * Purpose: proves `TransportPlanServiceChannelDriver` calls the plan service's
 *          `entitlements.effective_set.snapshot.get@1` (`GET /snapshots/current`) with no input, resolves the answer
 *          decoded to `PlanSnapshotWire` (other fields dropped), and lets a transport failure through for the reader to
 *          fail closed on.
 * Boundary: unit tier; a recording `ClientTransport` that decodes with the request's own output schema.
 * Runtime: node
 * Governing contract: ADR 0215 (decision 5); ADR 0260 (decisions 3 and 6).
 */
import { HttpMethod } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { TransportPlanServiceChannelDriver } from "#core/drivers/transport-plan-service-channel.driver";

/** The plan service's answer, with a field the wire type does not carry. */
const ANSWER = {
  version: 2,
  maxAgeSeconds: 60,
  scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  grants: { reports: true },
  seats: { full: 3 },
  paidSince: null,
  meterAllowances: [],
};

/** Records each sent request and answers it, or fails. */
class RecordingClientTransport extends ClientTransport {
  /** Requests sent, oldest first. */
  readonly sent: ClientRequest[] = [];

  /**
   * @param answer - what a send resolves, decoded, or rejects with when it is an Error.
   */
  constructor(private readonly answer: unknown) {
    super();
  }

  /** Records the request and answers it through its output schema. */
  send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return this.answer instanceof Error
      ? Promise.reject(this.answer)
      : Promise.resolve(request.output.parse(this.answer));
  }

  /** Never used: the driver only reads. */
  queue(): Promise<void> {
    return Promise.reject(new TypeError("not queued"));
  }
}

/** Guards the one call a product makes to read its tenant's plan. */
describe(TransportPlanServiceChannelDriver, () => {
  /** The key, the route and an empty input; the answer trimmed to the wire type. */
  it("reads the call scope's snapshot from the plan service", async () => {
    const transport = new RecordingClientTransport(ANSWER);

    const wire = await new TransportPlanServiceChannelDriver(transport).snapshot();

    expect(transport.sent).toMatchObject([
      {
        key: "entitlements.effective_set.snapshot.get@1",
        kind: "query",
        endpoint: { method: HttpMethod.Get, path: "/snapshots/current" },
        input: {},
      },
    ]);
    expect(wire).toEqual({
      version: 2,
      maxAgeSeconds: 60,
      scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
      grants: { reports: true },
      seats: { full: 3 },
      paidSince: null,
    });
  });

  /** A failure reaches the reader, which fails closed on it. */
  it("lets a transport failure through", async () => {
    const transport = new RecordingClientTransport(new TypeError("unreachable"));

    await expect(new TransportPlanServiceChannelDriver(transport).snapshot()).rejects.toThrow(
      "unreachable",
    );
  });
});
