/**
 * Stackra file contract:
 * Purpose: unit tests of `protectedResourceMetadata`: the RFC 9728 fields from the options, optional fields only when
 *          given, http allowed on loopback only, and refusals of a non-https URL, a fragment and no issuer.
 * Boundary: test only; pure values with example.test hosts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0348 (decision 2); RFC 9728.
 */
import { describe, expect, it } from "@stackra/testing";

import { protectedResourceMetadata } from "#core/functions/protected-resource-metadata.function";

describe("protectedResourceMetadata", () => {
  it("writes the RFC 9728 document from the options", () => {
    expect(
      protectedResourceMetadata({
        resource: "https://mcp.example.test/mcp",
        authorizationServers: ["https://id.example.test"],
        scopes: ["openid", "mcp"],
        name: "Example MCP",
        documentation: "https://docs.example.test/mcp",
      }),
    ).toEqual({
      resource: "https://mcp.example.test/mcp",
      authorization_servers: ["https://id.example.test"],
      bearer_methods_supported: ["header"],
      scopes_supported: ["openid", "mcp"],
      resource_name: "Example MCP",
      resource_documentation: "https://docs.example.test/mcp",
    });
  });

  it("leaves out what is not given and allows http on loopback", () => {
    expect(
      protectedResourceMetadata({
        resource: "http://localhost:4000/mcp",
        authorizationServers: ["http://127.0.0.1:8080"],
      }),
    ).toEqual({
      resource: "http://localhost:4000/mcp",
      authorization_servers: ["http://127.0.0.1:8080"],
      bearer_methods_supported: ["header"],
    });
  });

  it("refuses plain http, a fragment and an empty issuer list", () => {
    expect(() =>
      protectedResourceMetadata({
        resource: "http://mcp.example.test/mcp",
        authorizationServers: ["https://id.example.test"],
      }),
    ).toThrow(RangeError);
    expect(() =>
      protectedResourceMetadata({
        resource: "https://mcp.example.test/mcp#x",
        authorizationServers: ["https://id.example.test"],
      }),
    ).toThrow(RangeError);
    expect(() =>
      protectedResourceMetadata({
        resource: "https://mcp.example.test/mcp",
        authorizationServers: [],
      }),
    ).toThrow(RangeError);
  });
});
