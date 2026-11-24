/**
 * Stackra file contract:
 * Purpose: unit tests of `runDevMobile`: the app key, `--os` and the simulator are checked first (the device falls back to
 *          `STACKRA_IOS_DEVICE`); the app must be in the root runway, its template line in the checkout with a package.json
 *          and an installed node_modules; the checkout is prepared with the line's scope and node_modules, and the prebuild and the
 *          run follow one after another, stopping at the first that fails with its exit code.
 * Boundary: test only; Runway's `readRunway` and `prepareMobileDev` and `runProcess` are fakes, the template line is a temporary folder.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decision 6); ADR 0439; ADR 0481.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { prepareMobileDev, readRunway } from "@stackra/runway/node";

import { runDevMobile } from "#node/dev-mobile/functions/run-dev-mobile.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway/node", () => ({ prepareMobileDev: vi.fn(), readRunway: vi.fn() }));
vi.mock("#node/functions/run-process.function", () => ({ runProcess: vi.fn() }));

const DEVICE = "A44ABE24-0000";
let work: string;
let product: string;
let checkout: string;

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "stackra-dev-mobile-"));
  product = join(work, "product");
  checkout = join(work, "os");
  mkdirSync(product);
  mkdirSync(join(checkout, "apps", "mobile", "node_modules"), { recursive: true });
  writeFileSync(
    join(checkout, "apps", "mobile", "package.json"),
    JSON.stringify({ name: "@example/os-mobile" }),
  );
  delete process.env["STACKRA_IOS_DEVICE"];
  vi.mocked(readRunway)
    .mockReset()
    .mockReturnValue({
      mobile: { app: { template: "example/mobile@3" } },
    } as never);
  vi.mocked(prepareMobileDev)
    .mockReset()
    .mockResolvedValue({
      dir: join(product, ".stackra", "mobile", "app"),
      template: { package: "@example/os-mobile", version: "3.1.0" },
      entries: ["a", "b"],
    } as never);
  vi.mocked(runProcess).mockReset().mockResolvedValue(0);
});

afterEach(() => {
  delete process.env["STACKRA_IOS_DEVICE"];
  rmSync(work, { recursive: true, force: true });
});

const run = async (values: CliContext["values"], app?: string) => {
  const { io, output } = captureIo();
  const context = { cwd: product, io, values, positionals: [], rest: [], cli: async () => 0 };
  const result = await (
    app === undefined ? runDevMobile(context as never) : runDevMobile(context as never, app)
  ).catch((error: unknown) => error);
  return { result, output: output() };
};

const refusal = (result: unknown): string => {
  expect(result).toBeInstanceOf(CliUsageError);
  return (result as Error).message;
};

describe("runDevMobile", () => {
  it("prepares the checkout from the line's scope and node_modules, then prebuilds and runs on the device", async () => {
    const { result, output } = await run({ mobile: "app", os: checkout, device: DEVICE });

    expect(result).toBe(0);
    const line = join(checkout, "apps", "mobile");
    expect(readRunway).toHaveBeenCalledWith(join(product, "runway.yaml"), "root");
    expect(prepareMobileDev).toHaveBeenCalledWith({
      repository: product,
      app: "app",
      line: { scope: "@example", local: line },
      nodeModules: join(line, "node_modules"),
    });
    expect(output).toBe(
      `mobile app: @example/os-mobile@3.1.0 in ${join(product, ".stackra", "mobile", "app")}, 2 package(s)\n`,
    );
    const calls = vi.mocked(runProcess).mock.calls.map(([planned]) => planned);
    expect(calls.map((planned) => planned.args.slice(0, 2))).toEqual([
      ["prebuild", "--platform"],
      ["run:ios", "--configuration"],
    ]);
    expect(calls[1]?.args).toContain(DEVICE);
    expect(
      calls.every((planned) => planned.cwd === join(product, ".stackra", "mobile", "app")),
    ).toBe(true);
  });

  it("takes the app from its argument over --mobile, and the device from STACKRA_IOS_DEVICE", async () => {
    process.env["STACKRA_IOS_DEVICE"] = "FROM-ENV";
    const { result } = await run({ mobile: "other", os: checkout }, "app");
    expect(result).toBe(0);
    expect(prepareMobileDev).toHaveBeenCalledWith(expect.objectContaining({ app: "app" }));
    expect(vi.mocked(runProcess).mock.calls[1]?.[0].args).toContain("FROM-ENV");
  });

  it("stops at the first process that fails, with its exit code", async () => {
    vi.mocked(runProcess).mockResolvedValueOnce(65);
    const { result } = await run({ mobile: "app", os: checkout, device: DEVICE });
    expect(result).toBe(65);
    expect(runProcess).toHaveBeenCalledTimes(1);
  });

  it("returns the exit code of the run when the prebuild passed and the run fails", async () => {
    vi.mocked(runProcess).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    expect((await run({ mobile: "app", os: checkout, device: DEVICE })).result).toBe(1);
    expect(runProcess).toHaveBeenCalledTimes(2);
  });

  it.each([
    [{ os: "x", device: DEVICE }, "bad mobile app key: undefined"],
    [{ mobile: "App", os: "x", device: DEVICE }, "bad mobile app key: App"],
    [{ mobile: "app", device: DEVICE }, "pass --os <checkout>"],
    [{ mobile: "app", os: "x" }, "name the simulator"],
  ])("refuses %j before reading anything", async (values, message) => {
    const { result } = await run(values);
    expect(refusal(result)).toContain(message);
    expect(readRunway).not.toHaveBeenCalled();
    expect(runProcess).not.toHaveBeenCalled();
  });

  it("refuses an app the root runway does not declare", async () => {
    vi.mocked(readRunway).mockReturnValue({ mobile: {} } as never);
    const { result } = await run({ mobile: "app", os: checkout, device: DEVICE });
    expect(refusal(result)).toBe("unknown mobile app: app");
    vi.mocked(readRunway).mockReturnValue({} as never);
    expect(refusal((await run({ mobile: "app", os: checkout, device: DEVICE })).result)).toBe(
      "unknown mobile app: app",
    );
  });

  it("refuses a checkout with no such template, and one that is not installed", async () => {
    const missing = await run({ mobile: "app", os: join(work, "nowhere"), device: DEVICE });
    expect(refusal(missing.result)).toMatch(
      /no mobile template in the checkout: .*has no package.json/,
    );

    rmSync(join(checkout, "apps", "mobile", "node_modules"), { recursive: true });
    const notInstalled = await run({ mobile: "app", os: checkout, device: DEVICE });
    expect(refusal(notInstalled.result)).toContain(
      "the mobile template is not installed: run pnpm install in",
    );
    expect(prepareMobileDev).not.toHaveBeenCalled();
  });
});
