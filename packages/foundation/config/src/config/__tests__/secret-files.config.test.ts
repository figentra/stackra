/**
 * Stackra file contract:
 * Purpose: unit tests of `SecretFilesConfig`, its shape and `SECRET_FILES_CONFIG_SCHEMA`: keyed
 *          `config.secret_files`, built with the shipped defaults (equal to the initializers), taking a folder and
 *          names, and refusing a name that is not SCREAMING_SNAKE (a path in a name could leave the folder).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19, 20 and 26); ADR 0371 (amendment 2026-11-27).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import { SecretFilesConfig } from "#config/secret-files.config";
import { SECRET_FILES_CONFIG_SCHEMA } from "#core/constants/secret-files-config-schema.constant";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { buildConfig } from "#core/functions/build-config.function";
import { configKey } from "#core/functions/config-key.function";
import { SecretFilesOptions } from "#core/schemas/secret-files-options.schema";

describe("SecretFilesConfig", () => {
  it("is keyed config.secret_files with defaults equal to the initializers", () => {
    expect(configKey(SecretFilesConfig, "config")).toBe("config.secret_files");
    expect(schemaOf(SecretFilesOptions)).toBe(SECRET_FILES_CONFIG_SCHEMA);
    expect({ ...new SecretFilesOptions() }).toEqual(SECRET_FILES_CONFIG_SCHEMA.parse({}));
  });

  it("takes a folder and names, and refuses a name that is not SCREAMING_SNAKE", () => {
    const config = buildConfig(SecretFilesConfig, {
      values: { directory: "/run/secrets", names: ["RESEND_API_KEY"] },
    });
    expect(config.directory).toBe("/run/secrets");
    expect(config.names).toEqual(["RESEND_API_KEY"]);
    for (const name of ["../etc/passwd", "lower", "A/B", ""])
      expect(() => buildConfig(SecretFilesConfig, { values: { names: [name] } })).toThrow(
        ConfigInvalidError,
      );
  });
});
