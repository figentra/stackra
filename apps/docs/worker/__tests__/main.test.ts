/**
 * Stackra file contract:
 * Purpose: unit tests of the `stackra-docs` Worker script: `/-/version` names the running version in its body and its
 *          `x-stackra-version` header, uncached; any other path is the static site (the ASSETS binding).
 * Boundary: test only; a recording fake ASSETS binding.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0536.
 */
import worker from "../main";

const VERSION = "dc8dcd28-271b-4367-9840-6c244f84cb40";

/** A docs environment whose ASSETS binding records what it was asked for. */
function envOf() {
  const asked: string[] = [];
  return {
    asked,
    env: {
      ASSETS: {
        fetch: (request: Request) => {
          asked.push(new URL(request.url).pathname);
          return Promise.resolve(new Response("<html>", { status: 200 }));
        },
      },
      CF_VERSION_METADATA: { id: VERSION },
    },
  };
}

describe("the docs Worker script", () => {
  it("names the version that runs at /-/version", async () => {
    const { env, asked } = envOf();
    const response = await worker.fetch(new Request("https://docs.example/-/version"), env);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ version: VERSION });
    expect(response.headers.get("x-stackra-version")).toBe(VERSION);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(asked).toEqual([]);
  });

  it("hands every other path to the static site", async () => {
    const { env, asked } = envOf();
    const response = await worker.fetch(new Request("https://docs.example/adr"), env);
    expect(await response.text()).toBe("<html>");
    expect(asked).toEqual(["/adr"]);
  });

  it("refuses a write to /-/version", async () => {
    const { env } = envOf();
    const response = await worker.fetch(
      new Request("https://docs.example/-/version", { method: "POST" }),
      env,
    );
    expect(response.status).toBe(405);
  });
});
