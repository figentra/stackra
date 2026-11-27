/**
 * Stackra file contract:
 * Purpose: unit tests of `waitForHttp`: true once a server answers (any status), false when nothing listens before
 *          the deadline, and false at once when the run already ended.
 * Boundary: test only; a loopback server on a free port.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-2840.
 */
import { createServer } from "node:http";

import { describe, expect, it } from "@stackra/testing";

import { waitForHttp } from "#node/dev-root/functions/wait-for-http.function";

describe("waitForHttp", () => {
  it("answers true for a server that answers 404, false for a closed port or an ended run", async () => {
    const server = createServer((_incoming, outgoing) => outgoing.writeHead(404).end());
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    const port = typeof address === "object" && address !== null ? address.port : 0;
    try {
      expect(await waitForHttp(`http://127.0.0.1:${port}/`, 2000)).toBe(true);
    } finally {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
    expect(await waitForHttp(`http://127.0.0.1:${port}/`, 300, { everyMs: 50 })).toBe(false);
    const ended = new AbortController();
    ended.abort();
    const started = Date.now();
    expect(await waitForHttp(`http://127.0.0.1:${port}/`, 60_000, { signal: ended.signal })).toBe(
      false,
    );
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
