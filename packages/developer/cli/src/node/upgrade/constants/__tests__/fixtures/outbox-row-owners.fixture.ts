/**
 * Stackra file contract:
 * Purpose: the `outbox-row-owners` codemod fixture (0.27.0): a custom OutboxDriver, ChangeFeed and DeliveryDriver
 *          still on the old shape are reported, drivers already ported are not, and a file that does not import from
 *          `@stackra/outbox` is not read.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 8a70552.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const legacy = `import { ChangeFeed, DeliveryDriver, OutboxDriver } from "@stackra/outbox/contracts";

export class SqsOutboxDriver extends OutboxDriver {
  async due() {}
}

export class KinesisChangeFeed extends ChangeFeed {
  async read() {}
}

export class SqsDeliveryDriver extends DeliveryDriver {
  async lease() {}
}
`;

const ported = `import { ChangeFeed, DeliveryDriver, OutboxDriver } from "@stackra/outbox/contracts";

export class SqsOutboxDriver extends OutboxDriver {
  async claim() {}
  async load() {}
}

export class KinesisChangeFeed extends ChangeFeed {
  async claim() {}
}

export class SqsDeliveryDriver extends DeliveryDriver {
  async load() {}
}
`;

const unrelated = `import { OutboxDriver } from "./local-outbox";

export class LocalOutbox extends OutboxDriver {}
`;

export const OUTBOX_ROW_OWNERS_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "services/orders/src/drivers/sqs.driver.ts",
      before: legacy,
      after: legacy,
      findings: ["3:8", "7:8", "11:8"],
    },
    { path: "services/billing/src/drivers/sqs.driver.ts", before: ported, after: ported },
    { path: "services/billing/src/local.ts", before: unrelated, after: unrelated },
  ],
};
