/**
 * Stackra file contract:
 * Purpose: unit tests of `readReleaseNotes` over a throwaway repository: pending changesets that bump an `@stackra/*`
 *          package (not another scope's, not the README), the `@stackra/*` changelog entries from 0.4.0 on with their
 *          indentation removed, one per commit across the fixed group's changelogs, and nothing from `node_modules`
 *          or another scope's changelog.
 * Boundary: test only; writes the repository under the OS temp folder and removes it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0199 (Enforcement); STA-145.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { fixtureWorkspace } from "#node/upgrade/functions/__tests__/fixture-workspace";
import { readReleaseNotes } from "#node/upgrade/functions/read-release-notes.function";

const QUEUE = `# @stackra/queue

## 0.30.0

### Minor Changes

- 98a8940: Jobs are tenant-owned.

  Upgrade: drain the queue before you migrate.

### Patch Changes

- Updated dependencies [98a8940]
  - @stackra/outbox@0.30.0

## 0.3.0

### Minor Changes

- 1111111: Before the floor.
`;

const OUTBOX = `# @stackra/outbox

## 0.30.0

### Minor Changes

- 98a8940: Jobs are tenant-owned.

  Upgrade: drain the queue before you migrate.
- 2222222: Breaking: \`due\` is \`claim\`.
`;

let root: string;
let remove: () => void;

beforeEach(() => {
  ({ root, remove } = fixtureWorkspace({
    "pnpm-workspace.yaml": "packages:\n  - packages/*/*\n",
    ".changeset/README.md": "# .changeset\n",
    ".changeset/drop-x.md":
      '---\n"@stackra/queue": minor\n---\n\n### Breaking\n\n- `X` is removed.\n',
    ".changeset/acme.md": '---\n"@acme/app": minor\n---\n\nBreaking for acme only.\n',
    "packages/runtime/queue/CHANGELOG.md": QUEUE,
    "packages/runtime/outbox/CHANGELOG.md": OUTBOX,
    "packages/runtime/queue/node_modules/@stackra/old/CHANGELOG.md":
      "# @stackra/old\n\n## 0.5.0\n\n- 3333333: Breaking in a dependency copy.\n",
    "apps/acme/CHANGELOG.md": "# @acme/app\n\n## 0.5.0\n\n- 4444444: Breaking for acme.\n",
  }));
});

afterEach(() => remove());

describe("readReleaseNotes", () => {
  it("reads the @stackra changesets, then each @stackra changelog entry from the floor on, once per commit", () => {
    expect(readReleaseNotes(root)).toEqual([
      {
        file: ".changeset/drop-x.md",
        kind: "changeset",
        ref: "drop-x",
        text: "### Breaking\n\n- `X` is removed.",
      },
      {
        file: "packages/runtime/outbox/CHANGELOG.md",
        kind: "changelog",
        ref: "98a8940",
        version: "0.30.0",
        text: "Jobs are tenant-owned.\n\nUpgrade: drain the queue before you migrate.",
      },
      {
        file: "packages/runtime/outbox/CHANGELOG.md",
        kind: "changelog",
        ref: "2222222",
        version: "0.30.0",
        text: "Breaking: `due` is `claim`.",
      },
    ]);
  });

  it("answers nothing for a repository with no changesets or changelogs", () => {
    const empty = fixtureWorkspace({ "pnpm-workspace.yaml": "packages: []\n" });
    try {
      expect(readReleaseNotes(empty.root)).toEqual([]);
    } finally {
      empty.remove();
    }
  });
});
