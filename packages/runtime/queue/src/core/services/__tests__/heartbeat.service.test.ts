/**
 * Stackra file contract:
 * Purpose: unit tests of `HeartbeatService`: a job with a URL beats it with a GET, a job with none (or no secret at all)
 *          sends nothing; beats of one job are at least `minInterval` apart and never overlap, while other jobs beat on
 *          their own; a refused beat, a network error and a beat past its timeout are logged with the job name and the
 *          status or error name, never the URL, never throw, and do not count, so the next call tries again.
 * Boundary: test only; `fetch` is stubbed (no network), the clock is one the test moves and the URLs are made up.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0184 (decision 4); ADR 0147.
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock, Duration, Logger } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { HeartbeatConfig } from "#config/heartbeat.config";
import { HeartbeatService } from "#core/services/heartbeat.service";

const RELAY_URL = "https://uptime.example.test/api/v1/heartbeat/relay-token";

const CRON_URL = "https://uptime.example.test/api/v1/heartbeat/cron-token";

/** A clock the test moves. */
class MovableClock extends Clock {
  at = Date.UTC(2026, 10, 26, 12);

  now(): Date {
    return new Date(this.at);
  }
}

/** A logger that keeps every line it is given. */
class RecordingLogger extends Logger {
  readonly lines: { readonly level: string; readonly event: string; readonly fields: unknown }[] =
    [];

  debug(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "debug", event, fields });
  }

  info(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "info", event, fields });
  }

  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "warn", event, fields });
  }

  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.lines.push({ level: "error", event, fields });
  }
}

/** A secret store holding `STACKRA_HEARTBEAT_URLS` = `urls`, or none for `null`. */
const secretsOf = (urls: Readonly<Record<string, string>> | null): SecretStore =>
  new (class extends SecretStore {
    get(name: string): string | undefined {
      return name === "STACKRA_HEARTBEAT_URLS" && urls !== null ? JSON.stringify(urls) : undefined;
    }
  })();

/** The URLs of the tests: the outbox relay's and a cron's. */
const URLS: Readonly<Record<string, string>> = {
  "outbox-relay": RELAY_URL,
  "billing-invoice-send-reminders-1": CRON_URL,
};

/** A sender over `urls` (`null`: no secret), a fresh clock and logger, and a stubbed `fetch` answering `answer`. */
function setup(
  urls: Readonly<Record<string, string>> | null = URLS,
  answer: (url: string, init: RequestInit) => Promise<Response> = async () =>
    new Response("OK", { status: 200 }),
  values: Partial<Pick<HeartbeatConfig, "minInterval" | "timeout">> = {},
) {
  const fetch = vi.fn(answer);
  vi.stubGlobal("fetch", fetch);
  const clock = new MovableClock();
  const logger = new RecordingLogger();
  const config = buildConfig(HeartbeatConfig, { secrets: secretsOf(urls), values });
  return { heartbeats: new HeartbeatService(config, clock, logger), fetch, clock, logger };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(HeartbeatService, () => {
  it("beats the job's URL with a GET", async () => {
    const { heartbeats, fetch, logger } = setup();
    expect(heartbeats.has("outbox-relay")).toBe(true);
    await heartbeats.beat("outbox-relay");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe(RELAY_URL);
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: "GET", redirect: "error" });
    expect(fetch.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    expect(logger.lines).toEqual([]);
  });

  it("sends nothing for a job with no URL, or when no secret is set", async () => {
    const { heartbeats, fetch } = setup();
    expect(heartbeats.has("queue-default")).toBe(false);
    await heartbeats.beat("queue-default");
    expect(fetch).not.toHaveBeenCalled();

    const unset = setup(null);
    await unset.heartbeats.beat("outbox-relay");
    expect(unset.fetch).not.toHaveBeenCalled();
  });

  it("beats one job at most once per minInterval, each job on its own", async () => {
    const { heartbeats, fetch, clock } = setup();
    await heartbeats.beat("outbox-relay");
    await heartbeats.beat("outbox-relay");
    await heartbeats.beat("billing-invoice-send-reminders-1");
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([RELAY_URL, CRON_URL]);
    clock.at += Duration.toMilliseconds(Duration.seconds(10)) - 1;
    await heartbeats.beat("outbox-relay");
    expect(fetch).toHaveBeenCalledTimes(2);
    clock.at += 1;
    await heartbeats.beat("outbox-relay");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("takes a shorter gap from the configuration", async () => {
    const { heartbeats, fetch, clock } = setup(URLS, undefined, {
      minInterval: Duration.seconds(1),
    });
    await heartbeats.beat("outbox-relay");
    clock.at += 1000;
    await heartbeats.beat("outbox-relay");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("never overlaps two beats of one job", async () => {
    const answers: ((response: Response) => void)[] = [];
    const { heartbeats, fetch } = setup(
      URLS,
      () =>
        new Promise<Response>((resolve) => {
          answers.push(resolve);
        }),
    );
    const first = heartbeats.beat("outbox-relay");
    await heartbeats.beat("outbox-relay");
    expect(fetch).toHaveBeenCalledTimes(1);
    answers[0]?.(new Response(null, { status: 200 }));
    await first;
  });

  it("logs a refused beat without its URL, never throws, and tries again on the next call", async () => {
    const { heartbeats, fetch, logger } = setup(
      URLS,
      async () => new Response("nope", { status: 404 }),
    );
    await expect(heartbeats.beat("outbox-relay")).resolves.toBeUndefined();
    await heartbeats.beat("outbox-relay");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(logger.lines).toEqual([
      {
        level: "warn",
        event: "queue.heartbeat_failed",
        fields: { job: "outbox-relay", status: 404 },
      },
      {
        level: "warn",
        event: "queue.heartbeat_failed",
        fields: { job: "outbox-relay", status: 404 },
      },
    ]);
    expect(JSON.stringify(logger.lines)).not.toContain("relay-token");
  });

  it("logs a network error by its name only and never throws", async () => {
    const { heartbeats, logger } = setup(URLS, async (url) => {
      throw new TypeError(`fetch failed for ${url}`);
    });
    await expect(heartbeats.beat("outbox-relay")).resolves.toBeUndefined();
    expect(logger.lines).toEqual([
      {
        level: "warn",
        event: "queue.heartbeat_failed",
        fields: { job: "outbox-relay", error: "TypeError" },
      },
    ]);
    expect(JSON.stringify(logger.lines)).not.toContain("relay-token");
  });

  it("abandons a beat past its timeout", async () => {
    const { heartbeats, logger } = setup(
      URLS,
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(init.signal?.reason), {
            once: true,
          });
        }),
      { timeout: Duration.parse("100ms") },
    );
    const started = Date.now();
    await expect(heartbeats.beat("outbox-relay")).resolves.toBeUndefined();
    expect(Date.now() - started).toBeLessThan(2000);
    expect(logger.lines).toEqual([
      {
        level: "warn",
        event: "queue.heartbeat_failed",
        fields: { job: "outbox-relay", error: "TimeoutError" },
      },
    ]);
  });
});
