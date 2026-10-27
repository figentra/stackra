/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumentsConfig`: keyed `documents`, its defaults equal the shipped schema's, runway's URL
 *          layer applies, the `authorization` header comes from the secret store only, and a bad URL is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); STA-344.
 */
import {
  buildConfig,
  Config,
  ConfigInvalidError,
  configKey,
  MemorySecretStoreDriver,
} from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { DocumentsConfig } from "#config/documents.config";
import { DOCUMENTS_CONFIG_SCHEMA } from "#core/constants/documents-config-schema.constant";
import { gotenbergEndpointOf } from "#core/functions/gotenberg-endpoint-of.function";

describe("DocumentsConfig", () => {
  it("is a configuration keyed documents", () => {
    expect(new DocumentsConfig()).toBeInstanceOf(Config);
    expect(configKey(DocumentsConfig, "documents")).toBe("documents");
  });

  it("builds with the shipped defaults and no header", () => {
    const config = buildConfig(DocumentsConfig);
    const { gotenbergAuthorization, ...values } = DOCUMENTS_CONFIG_SCHEMA.parse({});
    expect({ ...config }).toEqual(values);
    expect(gotenbergAuthorization).toBe("");
    expect(gotenbergEndpointOf(config)).toEqual({
      url: "http://127.0.0.1:3000",
      timeoutMs: 30_000,
      headers: {},
    });
  });

  it("takes runway's URL and the secret header", () => {
    const config = buildConfig(DocumentsConfig, {
      values: { gotenbergUrl: "http://gotenberg.ksa.internal:3000" },
      secrets: new MemorySecretStoreDriver().set("DOCUMENTS_GOTENBERG_AUTHORIZATION", "Basic x"),
    });
    expect(gotenbergEndpointOf(config)).toEqual({
      url: "http://gotenberg.ksa.internal:3000",
      timeoutMs: 30_000,
      headers: { authorization: "Basic x" },
    });
  });

  it("refuses a URL that is not one", () => {
    expect(() => buildConfig(DocumentsConfig, { values: { gotenbergUrl: "gotenberg" } })).toThrow(
      ConfigInvalidError,
    );
  });
});
