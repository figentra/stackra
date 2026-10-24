/**
 * Stackra file contract:
 * Purpose: unit tests of `useAction`: `isAllowed` follows the session (true without one), `run` sends through the
 *          transport and resolves the answer, and a refusal rejects `run`.
 * Boundary: test only; the hook's result is taken from a string render and `run` is called after it, over the client
 *           fake and a stand-in session and cache.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 4); ADR 0208 (permissions).
 */
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { isRefusal } from "@stackra/errors";
import { refusal } from "@stackra/errors/testing";
import { ServerStateCache } from "@stackra/query";
import { describe, expect, it } from "@stackra/testing";
import { QueryClient } from "@tanstack/query-core";
import { renderToString } from "react-dom/server";
import { z } from "zod";

import { ClientSession } from "#contracts/ports/client-session.port";
import { ClientTransport } from "#contracts/ports/client-transport.port";
import { actionRef } from "#core/functions/action-ref.function";
import { refusalRef } from "#core/functions/refusal-ref.function";
import { useAction } from "#react/action/use-action";
import type { UseActionResult } from "#react/action/use-action-result.type";
import { ClientFake } from "#testing/client.fake";

class CancelOrderAction extends actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ status: z.string() }),
}) {}

class OrderNotPayableError extends refusalRef("orders.order_not_payable") {}

/** A session holding exactly `permissions`. */
class StubSession extends ClientSession {
  private readonly permissions: readonly string[];

  constructor(permissions: readonly string[]) {
    super();
    this.permissions = permissions;
  }

  headers(): Promise<Readonly<Record<string, string>>> {
    return Promise.resolve({});
  }

  can(permission: string): boolean {
    return this.permissions.includes(permission);
  }
}

/** Hands the hook's result to `report`. */
function Probe({
  report,
}: {
  readonly report: (result: UseActionResult<typeof CancelOrderAction>) => void;
}) {
  report(useAction(CancelOrderAction));
  return null;
}

/** The hook's result under a container over `fake`, with `session` when given. */
async function actionOf(
  fake: ClientFake,
  session?: ClientSession,
): Promise<UseActionResult<typeof CancelOrderAction>> {
  const cache = Object.assign(Object.create(ServerStateCache.prototype) as ServerStateCache, {
    client: new QueryClient(),
    watch: () => () => undefined,
  });
  const overrides = new Map<Token, object>([
    [ClientTransport, fake],
    [ServerStateCache, cache],
  ]);
  if (session !== undefined) overrides.set(ClientSession, session);
  const container = await Container.create([], { overrides });
  let result: UseActionResult<typeof CancelOrderAction> | undefined;
  renderToString(
    <ContainerProvider container={container}>
      <Probe
        report={(value) => {
          result = value;
        }}
      />
    </ContainerProvider>,
  );
  if (result === undefined) throw new Error("the probe did not render");
  return result;
}

describe("useAction", () => {
  it("is allowed when the session holds the permission, or when no session is bound", async () => {
    expect(
      (await actionOf(new ClientFake(), new StubSession(["orders.order.cancel"]))).isAllowed,
    ).toBe(true);
    expect((await actionOf(new ClientFake(), new StubSession([]))).isAllowed).toBe(false);
    expect((await actionOf(new ClientFake())).isAllowed).toBe(true);
  });

  it("runs the action through the transport", async () => {
    const fake = new ClientFake();
    fake.on(CancelOrderAction).returns({ status: "cancelled" });
    const cancel = await actionOf(fake);
    expect(cancel.isPending).toBe(false);
    expect(await cancel.run({ orderId: "ord_1" })).toEqual({
      queued: false,
      data: { status: "cancelled" },
    });
    expect(fake.called(CancelOrderAction)).toEqual([{ orderId: "ord_1" }]);
  });

  it("rejects a run with the producer's refusal", async () => {
    const fake = new ClientFake();
    fake.on(CancelOrderAction).throws(refusal(OrderNotPayableError));
    const cancel = await actionOf(fake);
    await expect(cancel.run({ orderId: "ord_1" })).rejects.toSatisfy((error) =>
      isRefusal(error, OrderNotPayableError),
    );
  });
});
