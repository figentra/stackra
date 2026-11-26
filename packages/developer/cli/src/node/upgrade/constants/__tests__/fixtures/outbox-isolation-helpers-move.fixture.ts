/**
 * Stackra file contract:
 * Purpose: the `outbox-isolation-helpers-move` codemod fixture (0.30.0): the three isolation helpers move from
 *          `@stackra/outbox` to `@stackra/actions` (joining an existing import of it), the outbox names stay, a
 *          re-export keeps its public names, and a file that imports nothing moved is left alone.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 82dccb3.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const untouched = `import { OutboxService } from "@stackra/outbox";

export const outbox = OutboxService;
`;

export const OUTBOX_ISOLATION_HELPERS_MOVE_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "services/orders/src/relay.ts",
      before: `import { Action } from "@stackra/actions";
import { boundIsolation, ClaimNotLoadedError, OutboxService } from "@stackra/outbox";

export const parts = [Action, boundIsolation, ClaimNotLoadedError, OutboxService];
`,
      after: `import { Action, boundIsolation, ClaimNotLoadedError } from "@stackra/actions";
import { OutboxService } from "@stackra/outbox";

export const parts = [Action, boundIsolation, ClaimNotLoadedError, OutboxService];
`,
    },
    {
      path: "services/orders/src/errors.ts",
      before: `import { RowIsolationMissingError } from "@stackra/outbox";

export const missing = new RowIsolationMissingError("x");
`,
      after: `import { RowIsolationMissingError } from "@stackra/actions";

export const missing = new RowIsolationMissingError("x");
`,
    },
    {
      path: "packages/relay-kit/src/index.ts",
      before: `export { ClaimNotLoadedError, OutboxService } from "@stackra/outbox";
`,
      after: `export { OutboxService } from "@stackra/outbox";
export { ClaimNotLoadedError } from "@stackra/actions";
`,
    },
    { path: "services/orders/src/outbox.ts", before: untouched, after: untouched },
  ],
};
