/**
 * Stackra file contract:
 * Purpose: unit tests of `sentryEnvelope`: three newline-separated JSON lines (envelope header, item header, event);
 *          the event carries the error's name, message and frames innermost last, the tags, environment and release
 *          only when set, a refusal's code, and only the type of a thrown non-Error.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decisions 5 and 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { ForbiddenError } from "#core/errors/forbidden.error";
import { sentryEnvelope } from "#core/functions/sentry-envelope.function";

const REPORT = {
  eventId: "0123456789abcdef0123456789abcdef",
  at: new Date("2026-10-25T09:00:00.000Z"),
  dsn: "https://pub@o1.ingest.example.test/42",
  environment: "",
  release: "",
};

/** The three lines, parsed. */
function lines(body: string): readonly Record<string, unknown>[] {
  return body.split("\n").map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("sentryEnvelope", () => {
  it("writes the envelope header, the item header and the event", () => {
    const error = new TypeError("bad thing");
    error.stack = [
      "TypeError: bad thing",
      "    at inner (/srv/app/a.js:10:5)",
      "    at /srv/app/b.js:20:7",
      "outer@https://app.test/c.js:30:9",
    ].join("\n");
    const [header, item, event] = lines(sentryEnvelope(error, REPORT));
    expect(header).toEqual({
      event_id: REPORT.eventId,
      sent_at: "2026-10-25T09:00:00.000Z",
      dsn: REPORT.dsn,
    });
    expect(item).toEqual({ type: "event" });
    expect(event).toMatchObject({
      event_id: REPORT.eventId,
      timestamp: REPORT.at.getTime() / 1000,
      platform: "javascript",
      level: "error",
      exception: {
        values: [
          {
            type: "TypeError",
            value: "bad thing",
            stacktrace: {
              frames: [
                { function: "outer", filename: "https://app.test/c.js", lineno: 30, colno: 9 },
                { filename: "/srv/app/b.js", lineno: 20, colno: 7 },
                { function: "inner", filename: "/srv/app/a.js", lineno: 10, colno: 5 },
              ],
            },
          },
        ],
      },
    });
    expect(event).not.toHaveProperty("environment");
    expect(event).not.toHaveProperty("release");
    expect(event).not.toHaveProperty("tags");
  });

  it("tags a refusal with its code and adds the environment and release", () => {
    const [, , event] = lines(
      sentryEnvelope(ForbiddenError.create(), {
        ...REPORT,
        environment: "production",
        release: "1.2.3",
      }),
    );
    expect(event).toMatchObject({
      environment: "production",
      release: "1.2.3",
      tags: { code: "forbidden" },
    });
  });

  it("reports only the type of a thrown non-Error", () => {
    const [, , event] = lines(sentryEnvelope({ secret: "canary-value" }, REPORT));
    expect(JSON.stringify(event)).not.toContain("canary-value");
    expect(event).toMatchObject({
      exception: { values: [{ type: "object", value: "a thrown object" }] },
    });
  });
});
