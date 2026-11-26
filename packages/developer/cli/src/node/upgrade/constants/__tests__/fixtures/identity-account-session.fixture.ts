/**
 * Stackra file contract:
 * Purpose: the `identity-account-session` codemod fixture (0.9.0): an import renamed with its uses, an aliased import
 *          that keeps its alias, a file where `AccountSession` is already taken (aliased to the old name instead), a
 *          re-export that keeps its public name, a namespace use renamed, and `@stackra/native-spotlight`'s own
 *          `DeviceSession` left alone.
 * Boundary: test fixture only; the sources are strings, never compiled.
 * Runtime: node (vitest)
 * Governing contract: ADR 0199 (Enforcement); STA-145; changeset 378f6a6.
 */
import type { CodemodFixture } from "#node/upgrade/constants/__tests__/fixtures/codemod-fixture.type";

const spotlight = `import type { DeviceSession } from "@stackra/native-spotlight";

export const sessions: DeviceSession[] = [];
`;

export const IDENTITY_ACCOUNT_SESSION_FIXTURE: CodemodFixture = {
  files: [
    {
      path: "apps/console/src/security/sessions.tsx",
      before: `import type { AccountSecurity, DeviceSession } from "@stackra/identity/contracts";

export function rows(security: AccountSecurity, sessions: readonly DeviceSession[]): DeviceSession[] {
  return sessions.filter((session: DeviceSession) => session.current);
}
`,
      after: `import type { AccountSecurity, AccountSession } from "@stackra/identity/contracts";

export function rows(security: AccountSecurity, sessions: readonly AccountSession[]): AccountSession[] {
  return sessions.filter((session: AccountSession) => session.current);
}
`,
    },
    {
      path: "apps/console/src/security/aliased.ts",
      before: `import { type DeviceSession as Row } from "@stackra/identity/contracts";

export type Rows = Row[];
`,
      after: `import { type AccountSession as Row } from "@stackra/identity/contracts";

export type Rows = Row[];
`,
    },
    {
      path: "apps/console/src/security/taken.ts",
      before: `import type { DeviceSession } from "@stackra/identity/contracts";

type AccountSession = { id: string };
export const pair: [DeviceSession, AccountSession] | undefined = undefined;
`,
      after: `import type { AccountSession as DeviceSession } from "@stackra/identity/contracts";

type AccountSession = { id: string };
export const pair: [DeviceSession, AccountSession] | undefined = undefined;
`,
    },
    {
      path: "packages/security-kit/src/index.ts",
      before: `export type { DeviceSession } from "@stackra/identity/contracts";
`,
      after: `export type { AccountSession as DeviceSession } from "@stackra/identity/contracts";
`,
    },
    {
      path: "packages/security-kit/src/bare.ts",
      before: `import type { DeviceSession } from "@stackra/identity/contracts";

export type { DeviceSession };
`,
      after: `import type { AccountSession as DeviceSession } from "@stackra/identity/contracts";

export type { DeviceSession };
`,
    },
    {
      path: "apps/console/src/security/namespace.ts",
      before: `import type * as identity from "@stackra/identity/contracts";

export type Row = identity.DeviceSession;
`,
      after: `import type * as identity from "@stackra/identity/contracts";

export type Row = identity.AccountSession;
`,
    },
    { path: "apps/mobile/src/spotlight.ts", before: spotlight, after: spotlight },
  ],
};
