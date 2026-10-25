/**
 * Stackra file contract:
 * Purpose: `@Secret("NAME")`, the field decorator that marks a field whose value is a secret, resolved blind by its
 *          name through the `SecretStore` port: on a config's schema class, on an integration and on a connection.
 * Boundary: made with `createDecorator`, so it records the name and installs no accessor; `buildConfig` resolves the
 *           value and keeps it off every serialisation. Typed against its field, so tsc refuses it on a field that is
 *           not a string. The name is SCREAMING_SNAKE (ADR 0231), checked when the class is defined; gen fails a bare
 *           `@Secret` with `secret_name_missing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (R6; 2026-10-23 item 2); ADR 0305 (rule 34: the field sits on the schema class);
 *                     ADR 0173; ADR 0231 (secret names).
 */
import { createDecorator, DecoratorTarget } from "@stackra/container";
import type { FieldDecorator } from "@stackra/validation";

/** The recording decorator; `Secret(name)` checks the name, then applies it. */
const SECRET = createDecorator<string>({
  kind: "secret",
  target: DecoratorTarget.Field,
  kinds: ["schema", "integration", "connection"],
});

/** A secret name: SCREAMING_SNAKE words (`RESEND_API_KEY`). */
const SECRET_NAME = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/;

/**
 * Marks a string field as the secret `name`; the name is the address of the value, never the value.
 *
 * @throws TypeError when `name` is not SCREAMING_SNAKE.
 * @example
 * ```ts
 * export class CommerceOptions extends Schema {
 *   @Secret("PRICING_API_KEY")
 *   pricingApiKey!: string;
 * }
 * ```
 */
export function Secret(name: string): FieldDecorator<string> {
  if (!SECRET_NAME.test(name))
    throw new TypeError(
      `@Secret("${name}"): a secret name is SCREAMING_SNAKE, such as RESEND_API_KEY`,
    );
  return SECRET(name) as unknown as FieldDecorator<string>;
}

/** The secret fields of a class and its ancestors, to their secret names. */
Secret.members = SECRET.members;
