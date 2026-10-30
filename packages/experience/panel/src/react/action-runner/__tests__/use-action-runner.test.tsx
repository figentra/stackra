/**
 * Stackra file contract:
 * Purpose: unit tests of `useActionRunner`: an L2 action asks first and sends nothing when declined; a confirmed run resolves
 *          done with the answer and toasts the success text; an action with no risk runs at once; a refusal resolves
 *          refused after a danger toast.
 * Boundary: unit tier, jsdom; the confirmation and the toast are spies, translation returns the key, the transport is the
 *           client fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0139 (declared confirmation); ADR 0140; ADR 0260.
 */
// @vitest-environment jsdom
import { actionRef, refusalRef } from "@stackra/clients";
import { ClientTransport } from "@stackra/clients/contracts";
import { fakeClient } from "@stackra/clients/testing";
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { refusal } from "@stackra/errors/testing";
import type { I18nKey } from "@stackra/i18n";
import { Risk } from "@stackra/iam";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import type { ActionRunner } from "#react/action-runner/action-runner.type";
import { useActionRunner } from "#react/action-runner/use-action-runner";

const ui = vi.hoisted(() => ({ confirm: vi.fn(), toast: vi.fn() }));

vi.mock("@stackra/ui/react", () => ({
  useConfirmation: () => ui.confirm,
  toast: ui.toast,
}));

vi.mock("@stackra/i18n/react", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
  }),
  useNumber: () => (value: number) => String(value),
  useMoney: () => (minor: number, currency: string) => `${currency} ${minor}`,
}));

class CancelOrderAction extends actionRef("orders.order.cancel@1", {
  input: z.object({ orderId: z.string() }),
  output: z.object({ status: z.string() }),
  risk: Risk.L2,
  success: "orders::actions.order.cancel.success" as I18nKey,
}) {}

class ArchiveAction extends actionRef("catalogue.product.archive@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({}),
}) {}

class OrderNotCancellableError extends refusalRef("orders.order_not_cancellable") {}

/** Hands the hook's runner to `report`. */
function Probe({ report }: { readonly report: (runner: ActionRunner) => void }) {
  report(useActionRunner());
  return null;
}

/** The runner under a container over `fake`. */
async function runnerOf(fake: ReturnType<typeof fakeClient>): Promise<ActionRunner> {
  const container = await Container.create([], { overrides: new Map([[ClientTransport, fake]]) });
  let runner: ActionRunner | undefined;
  render(
    <ContainerProvider container={container}>
      <Probe
        report={(found) => {
          runner = found;
        }}
      />
    </ContainerProvider>,
  );
  if (runner === undefined) throw new Error("the runner did not render");
  return runner;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useActionRunner", () => {
  it("asks before an L2 action and sends nothing when declined", async () => {
    const fake = fakeClient();
    ui.confirm.mockResolvedValue(false);
    const run = await runnerOf(fake);
    await expect(run(CancelOrderAction, { orderId: "ord_1" })).resolves.toEqual({
      status: "cancelled",
    });
    expect(ui.confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: "warning" }));
    expect(fake.called(CancelOrderAction)).toHaveLength(0);
  });

  it("runs a confirmed action and toasts its success text", async () => {
    const fake = fakeClient((client) =>
      client.on(CancelOrderAction).returns({ status: "cancelled" }),
    );
    ui.confirm.mockResolvedValue(true);
    const run = await runnerOf(fake);
    await expect(run(CancelOrderAction, { orderId: "ord_1" })).resolves.toEqual({
      status: "done",
      data: { status: "cancelled" },
    });
    expect(ui.toast).toHaveBeenCalledWith("orders::actions.order.cancel.success", {
      tone: "success",
    });
  });

  it("skips its own dialog when the caller's modal was the confirmation", async () => {
    const fake = fakeClient((client) =>
      client.on(CancelOrderAction).returns({ status: "cancelled" }),
    );
    const run = await runnerOf(fake);
    await expect(
      run(CancelOrderAction, { orderId: "ord_1" }, { confirmed: true }),
    ).resolves.toMatchObject({ status: "done" });
    expect(ui.confirm).not.toHaveBeenCalled();
    expect(fake.called(CancelOrderAction)).toHaveLength(1);
  });

  it("runs an action without a risk at once", async () => {
    const fake = fakeClient((client) => client.on(ArchiveAction).returns({}));
    const run = await runnerOf(fake);
    await expect(run(ArchiveAction, { productId: "prd_1" })).resolves.toMatchObject({
      status: "done",
    });
    expect(ui.confirm).not.toHaveBeenCalled();
    expect(ui.toast).toHaveBeenCalledWith("panel::actions.done", { tone: "success" });
  });

  it("resolves a refusal after a danger toast", async () => {
    const fake = fakeClient((client) =>
      client.on(ArchiveAction).throws(refusal(OrderNotCancellableError as never)),
    );
    const run = await runnerOf(fake);
    const outcome = await run(ArchiveAction, { productId: "prd_1" });
    expect(outcome.status).toBe("refused");
    expect(ui.toast).toHaveBeenCalledWith(expect.any(String), { tone: "danger" });
  });
});
