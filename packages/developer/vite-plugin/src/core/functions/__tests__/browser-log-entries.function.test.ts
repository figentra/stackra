/**
 * Stackra file contract:
 * Purpose: unit tests of `browserLogEntries` and `browserLogRefusal`: a report's entries become browser dev log
 *          entries with the page's origin and path only, a bad time becomes the arrival time, a wrong shape is dropped
 *          and at most the entry limit is kept; a report is refused unless it is a same-origin JSON `POST` with the
 *          client's header.
 * Boundary: test only; pure functions.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2889.
 */
import { describe, expect, it } from "@stackra/testing";

import { BROWSER_LOG_LIMITS } from "#core/constants/browser-log-limits.constant";
import { browserLogEntries } from "#core/functions/browser-log-entries.function";
import { browserLogRefusal } from "#core/functions/browser-log-refusal.function";

const now = new Date("2026-11-27T02:00:00.000Z");

describe("browserLogEntries", () => {
  it("turns a report into browser entries, keeping the page's origin and path only", () => {
    expect(
      browserLogEntries(
        {
          entries: [
            {
              kind: "error",
              level: "error",
              message: "TypeError: Cannot read properties of undefined (reading 'id')",
              stack: "TypeError: …\n    at Orders (http://localhost:5173/src/orders.tsx:12:5)",
              url: "http://localhost:5173/orders?token=abc#row-3",
              time: "2026-11-27T01:59:58.000Z",
            },
            { kind: "console", level: "warn", message: "slow render", url: "javascript:alert(1)" },
          ],
        },
        "apps/console",
        now,
      ),
    ).toEqual([
      {
        time: "2026-11-27T01:59:58.000Z",
        source: "browser",
        level: "error",
        member: "apps/console",
        kind: "error",
        message: "TypeError: Cannot read properties of undefined (reading 'id')",
        stack: "TypeError: …\n    at Orders (http://localhost:5173/src/orders.tsx:12:5)",
        url: "http://localhost:5173/orders",
      },
      {
        time: now.toISOString(),
        source: "browser",
        level: "warn",
        member: "apps/console",
        kind: "console",
        message: "slow render",
      },
    ]);
  });

  it("writes a console call's structured arguments as text only after the logger's field rules mask them", () => {
    const [entry] = browserLogEntries(
      {
        entries: [
          {
            kind: "console",
            level: "error",
            args: [
              "call failed",
              {
                authorization: "Bearer abc.def",
                email: "dana@example.com",
                order: { id: 7, phone: "+971500000000" },
              },
              42,
            ],
          },
        ],
      },
      "apps/web",
      now,
    );
    expect(entry?.message).toBe(
      'call failed {"authorization":"[redacted]","email":"[redacted]","order":{"id":7,"phone":"[redacted]"}} 42',
    );
    expect(JSON.stringify(entry)).not.toMatch(/dana@example\.com|\+971500000000|abc\.def/);
  });

  it("drops what is not an entry and keeps at most the entry limit", () => {
    expect(browserLogEntries(null, ".", now)).toEqual([]);
    expect(browserLogEntries({ entries: "x" }, ".", now)).toEqual([]);
    expect(
      browserLogEntries(
        {
          entries: [
            { kind: "shell", level: "error", message: "x" },
            { kind: "error", level: "info", message: "x" },
            { kind: "error", level: "error", message: 1 },
            null,
          ],
        },
        ".",
        now,
      ),
    ).toEqual([]);
    const many = Array.from({ length: BROWSER_LOG_LIMITS.entries + 5 }, (_, index) => ({
      kind: "console",
      level: "warn",
      message: `w${index}`,
      time: "1999-01-01T00:00:00.000Z",
    }));
    const kept = browserLogEntries({ entries: many }, ".", now);
    expect(kept).toHaveLength(BROWSER_LOG_LIMITS.entries);
    expect(kept[0]?.time).toBe(now.toISOString());
  });
});

describe("browserLogRefusal", () => {
  const ok = {
    host: "localhost:5173",
    origin: "http://localhost:5173",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    "x-stackra-browser-log": "1",
  };

  it("takes a same-origin JSON POST from the client", () => {
    expect(browserLogRefusal("POST", ok)).toBeUndefined();
    const { origin: _origin, "sec-fetch-site": _site, ...bare } = ok;
    expect(browserLogRefusal("POST", bare)).toBeUndefined();
  });

  it("refuses another method, a missing header, another site or origin, and a body that is not JSON", () => {
    expect(browserLogRefusal("GET", ok)?.status).toBe(405);
    expect(browserLogRefusal("POST", { ...ok, "x-stackra-browser-log": undefined })?.status).toBe(
      403,
    );
    expect(browserLogRefusal("POST", { ...ok, "sec-fetch-site": "cross-site" })?.status).toBe(403);
    expect(browserLogRefusal("POST", { ...ok, origin: "https://evil.example" })?.status).toBe(403);
    expect(browserLogRefusal("POST", { ...ok, origin: "null" })?.status).toBe(403);
    expect(browserLogRefusal("POST", { ...ok, "content-type": "text/plain" })?.status).toBe(415);
  });
});
