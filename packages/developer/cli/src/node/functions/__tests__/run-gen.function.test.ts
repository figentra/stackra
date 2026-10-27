/**
 * Stackra file contract:
 * Purpose: unit tests of `runGen`: refusals print in gen's form and fail, a write run lists the written files, and a
 *          check run fails on stale files and passes when clean; the options (with the manifest pass) reach
 *          `generate`; a refused run that still wrote its clients or manifest lists them.
 * Boundary: test only; `@stackra/gen/node`'s `generate` is replaced by a fake, so no TypeScript host opens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 22 and 26).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { generate } from "@stackra/gen/node";

import { captureIo } from "#node/functions/capture-io.function";
import { runGen } from "#node/functions/run-gen.function";

vi.mock("@stackra/gen/node", () => ({ generate: vi.fn() }));

const fake = vi.mocked(generate);

beforeEach(() => {
  fake.mockReset();
});

describe("runGen", () => {
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
    expect(fake).toHaveBeenCalledWith("/repo/packages/x", { backend: "ts6" });
    expect(output()).toBe("wrote packages/x/stackra.manifest.json\n");
  });

  it("fails a check run on stale files and passes a clean one", async () => {
    fake.mockResolvedValue({ errors: [], files: [], changed: [".stackra/gen/wiring.ts"] });
    const stale = captureIo();
    expect(await runGen("/repo/packages/x", { base: "/repo", check: true }, stale.io)).toBe(false);
    expect(fake).toHaveBeenCalledWith("/repo/packages/x", { check: true });
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
    expect(fake).toHaveBeenCalledWith("/repo/services/x", { pass: "manifests" });
    expect(output()).toContain("wrote services/x/.stackra/gen/clients/sales.ts");
    expect(output()).toContain("only the files listed were written");
  });
});
