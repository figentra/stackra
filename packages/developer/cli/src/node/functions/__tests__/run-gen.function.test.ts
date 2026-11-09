/**
 * Stackra file contract:
 * Purpose: unit tests of `runGen`: refusals print in gen's form and fail, a write run lists the written files, and a
 *          check run fails on stale files and passes when clean; the options (with the manifest pass) reach
 *          `generate` with the Vite module loader; a refused run that still wrote its clients or manifest lists them; a
 *          warning prints and never fails a run, with or without `check`, while an error beside it still does.
 * Boundary: test only; `@stackra/gen/node`'s `generate` is replaced by a fake, so no TypeScript host opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 22 and 26); ADR 0101 (Enforcement: gen warns).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { generate } from "@stackra/gen/node";

import { captureIo } from "#node/functions/capture-io.function";
import { loadWithVite } from "#node/functions/load-with-vite.function";
import { runGen } from "#node/functions/run-gen.function";

vi.mock("@stackra/gen/node", () => ({ generate: vi.fn() }));

const fake = vi.mocked(generate);

beforeEach(() => {
  fake.mockReset();
});

/** A finding of an action file: a refusal as it stands, a warning with its severity. */
const FINDING = {
  file: "src/modules/orders/actions/refund-order.action.ts",
  line: 0,
  column: 0,
  subject: "RefundOrderAction",
  message: "RefundOrderAction reaches past its module but starts no workflow",
  fix: "start a workflow",
};
const WARNING = { ...FINDING, code: "action_without_workflow", severity: "warning" as const };

describe("runGen", () => {
  it("prints a warning and still passes a write run and a check run", async () => {
    fake.mockResolvedValue({ errors: [], warnings: [WARNING], files: [], changed: [] });
    const write = captureIo();
    expect(await runGen("/repo/services/x", { base: "/repo" }, write.io)).toBe(true);
    expect(write.output()).toContain(
      "services/x/src/modules/orders/actions/refund-order.action.ts warning action_without_workflow RefundOrderAction",
    );
    expect(write.output()).toContain("fix: start a workflow");

    const check = captureIo();
    expect(await runGen("/repo/services/x", { base: "/repo", check: true }, check.io)).toBe(true);
    expect(check.output()).toContain("warning action_without_workflow");
  });

  it("still fails a run with an error beside a warning, printing both", async () => {
    fake.mockResolvedValue({
      errors: [{ ...FINDING, code: "workflow_without_action" }],
      warnings: [WARNING],
      files: [],
      changed: [],
    });
    const { io, output } = captureIo();
    expect(await runGen("/repo/services/x", { base: "/repo" }, io)).toBe(false);
    expect(output()).toContain("warning action_without_workflow");
    expect(output()).toContain("error workflow_without_action");
  });

  it("prints each refusal with its fix and fails", async () => {
    fake.mockResolvedValue({
      errors: [
        {
          code: "shape_number_kind",
          file: "src/node/schemas/x.schema.ts",
          line: 4,
          column: 3,
          subject: "X.count",
          message: "a number field needs @Int or @Num",
          fix: "add @Int",
        },
      ],
      files: [],
      changed: [],
    });
    const { io, output } = captureIo();
    expect(await runGen("/repo/packages/x", { base: "/repo" }, io)).toBe(false);
    expect(output()).toContain(
      "packages/x/src/node/schemas/x.schema.ts:4:3 error shape_number_kind X.count",
    );
    expect(output()).toContain("fix: add @Int");
    expect(output()).toContain("nothing was written");
  });

  it("lists the files a write run changed", async () => {
    fake.mockResolvedValue({ errors: [], files: [], changed: ["stackra.manifest.json"] });
    const { io, output } = captureIo();
    expect(await runGen("/repo/packages/x", { base: "/repo", backend: "ts6" }, io)).toBe(true);
    expect(fake).toHaveBeenCalledWith("/repo/packages/x", { backend: "ts6", loader: loadWithVite });
    expect(output()).toBe("wrote packages/x/stackra.manifest.json\n");
  });

  it("fails a check run on stale files and passes a clean one", async () => {
    fake.mockResolvedValue({ errors: [], files: [], changed: [".stackra/gen/wiring.ts"] });
    const stale = captureIo();
    expect(await runGen("/repo/packages/x", { base: "/repo", check: true }, stale.io)).toBe(false);
    expect(fake).toHaveBeenCalledWith("/repo/packages/x", { check: true, loader: loadWithVite });
    expect(stale.output()).toContain("stale: packages/x/.stackra/gen/wiring.ts");

    fake.mockResolvedValue({ errors: [], files: [], changed: [] });
    const clean = captureIo();
    expect(await runGen("/repo/packages/x", { base: "/repo", check: true }, clean.io)).toBe(true);
    expect(clean.output()).toBe("");
  });

  it("passes the manifest pass on, and lists the clients a refused run still wrote", async () => {
    fake.mockResolvedValue({
      errors: [
        {
          code: "shape_unknown_type",
          file: "src/modules/x/models/x.model.ts",
          line: 3,
          column: 2,
          subject: "X.kind",
          message: "`Kind` is not a shape type",
          fix: "use a shape type",
        },
      ],
      files: [],
      changed: [".stackra/gen/clients/sales.ts"],
    });
    const { io, output } = captureIo();
    expect(await runGen("/repo/services/x", { base: "/repo", pass: "manifests" }, io)).toBe(false);
    expect(fake).toHaveBeenCalledWith("/repo/services/x", {
      pass: "manifests",
      loader: loadWithVite,
    });
    expect(output()).toContain("wrote services/x/.stackra/gen/clients/sales.ts");
    expect(output()).toContain("only the files listed were written");
  });
});
