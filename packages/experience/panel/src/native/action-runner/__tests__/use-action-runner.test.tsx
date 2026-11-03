/**
 * Stackra file contract:
 * Purpose: unit tests of the native `useActionRunner`: an L2 action asks first and sends nothing when declined; a
 *          confirmed run resolves done and toasts the success text; the caller's modal skips the dialog; a spec's own
 *          confirmation asks with its words; a refusal resolves refused after a danger toast.
 * Boundary: unit tier, jsdom; the native confirmation and toast are spies, translation returns the key, the transport is
 *           the client fake.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0139 (declared confirmation); ADR 0140; ADR 0164 (native parity).
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

import { useActionRunner } from "#native/action-runner/use-action-runner";
import type { ActionRunner } from "#react/action-runner/action-runner.type";

const ui = vi.hoisted(() => ({ confirm: vi.fn(), toast: vi.fn() }));

vi.mock("@stackra/ui/native", () => ({ useConfirmation: () => ui.confirm, toast: ui.toast }));
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

class RestockAction extends actionRef("shop.product.restock@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({ stock: z.number() }),
  risk: Risk.L2,
  success: "shop::actions.product.restock.success" as I18nKey,
}) {}

class ArchiveAction extends actionRef("shop.product.archive@1", {
  input: z.object({ productId: z.string() }),
  output: z.object({}),
}) {}

class ProductLockedError extends refusalRef("shop.product_locked") {}

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

describe("native useActionRunner", () => {
  it("asks before an L2 action and sends nothing when declined", async () => {
    const fake = fakeClient();
    ui.confirm.mockResolvedValue(false);
    const run = await runnerOf(fake);
    await expect(run(RestockAction, { productId: "prd_1" })).resolves.toEqual({
      status: "cancelled",
    });
    expect(ui.confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: "warning" }));
    expect(fake.called(RestockAction)).toHaveLength(0);
  });

  it("runs a confirmed action and toasts its success text", async () => {
    const fake = fakeClient((client) => client.on(RestockAction).returns({ stock: 9 }));
    ui.confirm.mockResolvedValue(true);
    const run = await runnerOf(fake);
    await expect(run(RestockAction, { productId: "prd_1" })).resolves.toEqual({
      status: "done",
      data: { stock: 9 },
    });
    expect(ui.toast).toHaveBeenCalledWith("shop::actions.product.restock.success", {
      tone: "success",
    });
  });

  it("skips its own dialog when the caller's modal was the confirmation", async () => {
    const fake = fakeClient((client) => client.on(RestockAction).returns({ stock: 9 }));
    const run = await runnerOf(fake);
    await expect(
      run(RestockAction, { productId: "prd_1" }, { confirmed: true }),
    ).resolves.toMatchObject({ status: "done" });
    expect(ui.confirm).not.toHaveBeenCalled();
  });

  it("asks with a spec's own words", async () => {
    const fake = fakeClient((client) => client.on(ArchiveAction).returns({}));
    ui.confirm.mockResolvedValue(true);
    const run = await runnerOf(fake);
    await run(
      ArchiveAction,
      { productId: "prd_1" },
      { confirm: { title: "Archive this product?", tone: "danger" } },
    );
    expect(ui.confirm).toHaveBeenCalledWith({
      title: "Archive this product?",
      confirmLabel: "panel::actions.confirm",
      cancelLabel: "panel::actions.cancel",
      tone: "danger",
    });
  });

  it("resolves a refusal after a danger toast", async () => {
    const fake = fakeClient((client) =>
      client.on(ArchiveAction).throws(refusal(ProductLockedError as never)),
    );
    const run = await runnerOf(fake);
    const outcome = await run(ArchiveAction, { productId: "prd_1" });
    expect(outcome.status).toBe("refused");
    expect(ui.toast).toHaveBeenCalledWith(expect.any(String), { tone: "danger" });
  });
});
