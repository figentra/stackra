/**
 * Stackra file contract:
 * Purpose: the `actions-idempotency-complete-refused` codemod fixture (0.30.0): a custom store without
 *          `completeRefused` is reported (a class declaration and a class expression), a store that has it is not.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 0394e56.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const stores = `import { IdempotencyStore } from "@stackra/actions/contracts";

export class DynamoIdempotencyStore extends IdempotencyStore {
  async begin() {}
  async complete() {}
}

export class ReadyStore extends IdempotencyStore {
  async completeRefused() {}
}

export const inline = class extends IdempotencyStore {};
`;

export const ACTIONS_IDEMPOTENCY_COMPLETE_REFUSED_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "services/orders/src/drivers/dynamo-idempotency-store.driver.ts",
      before: stores,
      after: stores,
      findings: ["3:8", "12:23"],
    },
  ],
};
