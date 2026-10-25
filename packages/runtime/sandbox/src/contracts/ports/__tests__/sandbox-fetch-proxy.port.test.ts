/**
 * Stackra file contract:
 * Purpose: unit tests of the `SandboxFetchProxy` port: an abstract `Port`, so a driver extending it is a
 *          `SandboxFetchProxy` to `Sandbox` and answers a request with its reference and abort signal.
 * Boundary: test only; a minimal driver stands in for the host's egress.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0154 (decision 5); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { SandboxFetchProxy } from "#contracts/ports/sandbox-fetch-proxy.port";
import type { SandboxFetchRequest } from "#contracts/types/sandbox-fetch-request.type";
import type { SandboxFetchResponse } from "#contracts/types/sandbox-fetch-response.type";

/** Echoes the method, URL and reference back as the body. */
class EchoSandboxFetchProxy extends Driver(SandboxFetchProxy) {
  async fetch(request: SandboxFetchRequest, reference: string): Promise<SandboxFetchResponse> {
    return { status: 200, headers: {}, body: `${request.method} ${request.url} ${reference}` };
  }
}

describe("SandboxFetchProxy", () => {
  it("is a port a driver extends", async () => {
    const proxy: SandboxFetchProxy = new EchoSandboxFetchProxy();
    expect(proxy).toBeInstanceOf(SandboxFetchProxy);
    expect(proxy).toBeInstanceOf(Port);
    const response = await proxy.fetch(
      { url: "https://api.example.com/rates", method: "GET", headers: {} },
      "step-1",
      new AbortController().signal,
    );
    expect(response).toEqual({
      status: 200,
      headers: {},
      body: "GET https://api.example.com/rates step-1",
    });
  });
});
