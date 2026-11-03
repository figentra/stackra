/**
 * Stackra file contract:
 * Purpose: proves `isSecret` takes a field declared `secret: true`, guesses from a secret-like name when `secret` is
 *          absent, and lets an explicit `secret: false` (kept by `readCommand`) win over the name.
 * Boundary: unit test; pure functions.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-016; ADR 0506 (amendment 2026-11-03); ADR 0022 (test placement).
 */
// @covers sta-1731:FR-016
import { Str } from "@stackra/validation";

import { Command } from "#core/bases/command.base";
import { Option } from "#core/decorators/option.decorator";
import { isSecret } from "#core/functions/is-secret.function";
import { readCommand } from "#core/functions/read-command.function";

/** An SSH key path that is not a secret, beside a guessed and a declared one. */
class SshCommand extends Command({
  name: "ssh",
  description: "Ssh",
}) {
  @Option({ secret: false })
  @Str
  key?: string;

  @Option
  @Str
  apiToken?: string;

  @Option({ secret: true })
  @Str
  word?: string;

  @Option
  @Str
  region?: string;

  handle() {
    return 0;
  }
}

describe("isSecret", () => {
  const fields = new Map(readCommand(SshCommand).options.map((field) => [field.property, field]));
  const secret = (property: string) => {
    const field = fields.get(property);
    if (field === undefined) throw new Error(`no field ${property}`);
    return isSecret(field);
  };

  it("lets secret: false win over a secret-like name", () => {
    expect(secret("key")).toBe(false);
  });

  it("guesses from the name when secret is absent, and takes secret: true", () => {
    expect(secret("apiToken")).toBe(true);
    expect(secret("word")).toBe(true);
    expect(secret("region")).toBe(false);
    expect(
      isSecret({
        property: "key",
        flag: "key",
        role: "option",
        kind: "string",
        list: false,
        required: false,
      }),
    ).toBe(true);
  });
});
