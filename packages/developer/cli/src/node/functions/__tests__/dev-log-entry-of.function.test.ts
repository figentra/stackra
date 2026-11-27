/**
 * Stackra file contract:
 * Purpose: unit tests of `devLogEntryOf`: a blank line is no entry; colour codes are stripped; a JSON line keeps its
 *          fields and takes its level (word or pino number) and message from them; a text line takes its level from
 *          the first level word (Encore's `ERR`, `WRN`, `DBG`), else a JavaScript error line, an `error:` or
 *          `warning:` line; an indented line takes the level of the line before it.
 * Boundary: test only; pure function.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2889.
 */
import { describe, expect, it } from "@stackra/testing";

import { devLogEntryOf } from "#node/functions/dev-log-entry-of.function";

const time = "2026-11-27T02:00:00.000Z";
const on = (line: string, previous?: "debug" | "info" | "warn" | "error") =>
  devLogEntryOf(line, { stream: "stderr", member: "services/orders", time, previous });

describe("devLogEntryOf", () => {
  it("makes no entry of a blank line", () => {
    expect(on("   ")).toBeUndefined();
    expect(on("\u001B[2K")).toBeUndefined();
  });

  it("strips colour codes and keeps where the line came from", () => {
    expect(on("\u001B[32m  VITE v8.3.3\u001B[39m  ready in 210 ms")).toEqual({
      time,
      source: "server",
      member: "services/orders",
      stream: "stderr",
      level: "info",
      message: "  VITE v8.3.3  ready in 210 ms",
    });
  });

  it("reads a JSON line's level, message and fields", () => {
    expect(
      on(
        '{"level":"error","message":"charge failed","time":"x","orderId":"ord_1","code":"declined"}',
      ),
    ).toMatchObject({
      level: "error",
      message: "charge failed",
      fields: { orderId: "ord_1", code: "declined" },
    });
    expect(on('{"level":40,"msg":"slow query","ms":812}')).toMatchObject({
      level: "warn",
      message: "slow query",
      fields: { ms: 812 },
    });
    expect(on('{"severity":"CRITICAL","message":"down"}')?.level).toBe("error");
    expect(on('{"other":1}')).toMatchObject({
      level: "info",
      message: '{"other":1}',
      fields: { other: 1 },
    });
  });

  it("reads the first level word of a text line", () => {
    expect(on("4:25AM ERR request failed endpoint=orders.list error=boom")?.level).toBe("error");
    expect(on("4:25AM INF request completed code=ok error_count=0")?.level).toBe("info");
    expect(on("4:25AM WRN slow call")?.level).toBe("warn");
    expect(on("4:25AM DBG cache miss")?.level).toBe("debug");
  });

  it("reads JavaScript error, error: and warning: lines", () => {
    expect(on("TypeError: Cannot read properties of undefined (reading 'id')")?.level).toBe(
      "error",
    );
    expect(on("Error: listen EADDRINUSE: address already in use :::5173")?.level).toBe("error");
    expect(on("Uncaught ReferenceError: x is not defined")?.level).toBe("error");
    expect(on("[vite] Internal server error: Failed to resolve import")?.level).toBe("error");
    expect(on("warning: the lockfile is out of date")?.level).toBe("warn");
    expect(on("Found 0 errors in 12 files.")?.level).toBe("info");
  });

  it("gives an indented line the level of the line before it", () => {
    expect(on("    at handler (src/orders.ts:12:5)", "error")?.level).toBe("error");
    expect(on("  ➜  Local:   http://localhost:5173/", "info")?.level).toBe("info");
    expect(on("    at handler (src/orders.ts:12:5)")?.level).toBe("info");
  });
});
