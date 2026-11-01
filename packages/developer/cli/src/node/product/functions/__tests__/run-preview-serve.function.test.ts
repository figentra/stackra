/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra preview serve`: it refuses a missing surface and a bad port, hands Runway the surface,
 *          port, API upstream, prefixes and region, prints the URL, and closes the server on SIGINT.
 * Boundary: test only; Runway's `previewServe` is mocked, so nothing listens.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-1676.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { previewServe } from "@stackra/runway/node";
import { vi } from "vitest";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import { runPreviewServe } from "#node/product/functions/run-preview-serve.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  previewServe: vi.fn(),
}));

const run = (values: CliContext["values"]) => {
  const { io, output } = captureIo();
  const code = runPreviewServe({
    cwd: "/repo",
    io,
    values,
    positionals: [],
    rest: [],
    cli: async () => 0,
  });
  return { code, output };
};

afterEach(() => {
  vi.mocked(previewServe).mockReset();
});

describe("stackra preview serve", () => {
  it("refuses a missing surface and a bad port", async () => {
    await expect(run({}).code).rejects.toBeInstanceOf(CliUsageError);
    await expect(run({ surface: "console", port: "eighty" }).code).rejects.toBeInstanceOf(
      CliUsageError,
    );
  });

  // @covers sta-1676:FR-003
  it("serves with the given options, prints the URL and closes on SIGINT", async () => {
    const close = vi.fn(async () => undefined);
    vi.mocked(previewServe).mockResolvedValue({
      url: "http://127.0.0.1:4173",
      kv: {},
      close,
    } as never);

    const { code, output } = run({
      surface: "console",
      port: "4173",
      api: "http://127.0.0.1:4000",
      "api-prefix": "/api, /auth",
      region: "me-central-1",
    });
    await vi.waitFor(() => expect(output()).toContain("serving console at http://127.0.0.1:4173"));
    process.emit("SIGINT");

    expect(await code).toBe(0);
    expect(close).toHaveBeenCalledOnce();
    expect(vi.mocked(previewServe).mock.calls[0]?.[0]).toEqual({
      repository: "/repo",
      surface: "console",
      port: 4173,
      api: "http://127.0.0.1:4000",
      apiPrefixes: ["/api", "/auth"],
      region: "me-central-1",
    });
  });
});
