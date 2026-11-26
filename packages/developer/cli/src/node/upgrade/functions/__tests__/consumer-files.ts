/**
 * Stackra file contract:
 * Purpose: `CONSUMER_FILES`, the consumer workspace the `stackra upgrade` tests write with `fixtureWorkspace`: a
 *          catalog on 0.29.0, a service that pins identity at `^0.8.2` itself, a custom idempotency store, a console app
 *          with the rich text editor, and copies under `node_modules` and gen's `.stackra/` that must never be edited.
 * Boundary: test fixture only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-145.
 */

/** A consumer on 0.29.0: a catalog, a service that pins one package itself, a console app, an older stray pin. */
export const CONSUMER_FILES: Readonly<Record<string, string>> = {
  "pnpm-workspace.yaml": `packages:
  - apps/*
  - services/*
catalogs:
  stackra:
    "@stackra/actions": 0.29.0
    "@stackra/cli": 0.29.0
    "@stackra/ui": 0.29.0
`,
  "package.json": `{
  "name": "acme",
  "private": true,
  "devDependencies": { "@stackra/cli": "catalog:stackra" }
}
`,
  "services/orders/package.json": `{
  "name": "@acme/orders",
  "dependencies": {
    "@stackra/actions": "catalog:stackra",
    "@stackra/identity": "^0.8.2"
  }
}
`,
  "services/orders/src/drivers/memo-idempotency-store.driver.ts": `import { IdempotencyStore } from "@stackra/actions/contracts";

export class MemoIdempotencyStore extends IdempotencyStore {}
`,
  "services/orders/src/security.ts": `import type { DeviceSession } from "@stackra/identity/contracts";

export const sessions: DeviceSession[] = [];
`,
  "apps/console/package.json": `{ "name": "@acme/console", "dependencies": { "@stackra/ui": "catalog:stackra" } }
`,
  "apps/console/src/editor.tsx": `import { RichTextEditor } from "@stackra/ui/react";

export const Editor = () => <RichTextEditor />;
`,
  "apps/console/node_modules/@stackra/ui/index.js": `import { RichTextEditor } from "@stackra/ui/react";
`,
  "apps/console/.stackra/gen/clients.ts": `import type { DeviceSession } from "@stackra/identity/contracts";
`,
};
