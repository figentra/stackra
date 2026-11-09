/**
 * Stackra file contract:
 * Purpose: unit tests of `awaitOperation`: polls `<base>/<name>` until the operation is done and answers its
 *          `response` or its `error`; an operation still running after `attempts` polls, or a failed poll, throws naming
 *          the operation.
 * Boundary: test only; `fetch` is a fake answering one body per poll, and the poll interval is zero.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { awaitOperation } from "#node/functions/await-operation.function";

/** A fake `fetch` answering each body in turn with 200, then the last one forever. */
function polls(...bodies: unknown[]) {
  let index = 0;
  return vi.fn<typeof fetch>(async () => {
    const body = bodies[Math.min(index, bodies.length - 1)];
    index += 1;
    return new Response(JSON.stringify(body), { status: 200 });
  });
}

const REQUEST = {
  what: "create project",
  base: "https://cloudresourcemanager.googleapis.com/v3",
  name: "operations/cp.123",
  headers: { authorization: "Bearer canary-token" },
  intervalMs: 0,
};

describe("awaitOperation", () => {
  it("polls until done and answers the response", async () => {
    const fetcher = polls({ done: false }, {}, { done: true, response: { projectId: "acme" } });

    expect(await awaitOperation(fetcher, REQUEST)).toEqual({ response: { projectId: "acme" } });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[0]?.[0]).toBe(
      "https://cloudresourcemanager.googleapis.com/v3/operations/cp.123",
    );
    expect(fetcher.mock.calls[0]?.[1]?.method).toBe("GET");
  });

  it("answers the error of an operation that finished failing", async () => {
    const fetcher = polls({ done: true, error: { code: 7, message: "denied" } });

    expect(await awaitOperation(fetcher, REQUEST)).toEqual({
      error: { code: 7, message: "denied" },
    });
  });

  it("throws naming the operation when it does not finish in time", async () => {
    const fetcher = polls({ done: false });

    await expect(awaitOperation(fetcher, { ...REQUEST, attempts: 2 })).rejects.toThrow(
      new RunwayUnresolvedError("create project: operations/cp.123 did not finish"),
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("throws when a poll fails", async () => {
    const body = JSON.stringify({ error: { message: "Unavailable" } });
    const fetcher = vi.fn<typeof fetch>(async () => new Response(body, { status: 503 }));

    await expect(awaitOperation(fetcher, REQUEST)).rejects.toThrow(
      "create project: HTTP 503 (Unavailable)",
    );
  });
});
