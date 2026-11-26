/**
 * Stackra file contract:
 * Purpose: unit tests of `maskSecrets`: every value is masked wherever it appears, a longer secret that contains a
 *          shorter one is masked whole, a multi-line secret is masked line by line too, and an empty value masks
 *          nothing.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0173; STA-2860.
 */
import { describe, expect, it } from "@stackra/testing";

import { maskSecrets } from "#core/functions/mask-secrets.function";

describe("maskSecrets", () => {
  it("masks every occurrence of every value", () => {
    expect(maskSecrets("key=s3cr3t, again s3cr3t, token tk-1234", ["s3cr3t", "tk-1234"])).toBe(
      "key=***, again ***, token ***",
    );
  });

  it("masks a secret that contains another as a whole", () => {
    expect(maskSecrets("abc-secret-long", ["secret", "abc-secret-long"])).toBe("***");
  });

  it("masks each line of a multi-line secret, but not a short line like a PEM rule", () => {
    const pem = "-----BEGIN KEY-----\nMIIEvQIBADANBgkq\nhkiG9w0BAQEFAASC\n}";
    expect(maskSecrets("read MIIEvQIBADANBgkq from the file }", [pem])).toBe(
      "read *** from the file }",
    );
    expect(maskSecrets(`whole: ${pem}`, [pem])).toBe("whole: ***");
  });

  it("masks nothing for an empty value or no values", () => {
    expect(maskSecrets("nothing to hide", ["", ""])).toBe("nothing to hide");
    expect(maskSecrets("nothing to hide", [])).toBe("nothing to hide");
  });
});
