/**
 * Stackra file contract:
 * Purpose: unit tests of `streamIsCurrent`: a stream is current only when its classes list exactly its compiled step
 *          files, each once; one with no safety file never is, since gen writes one for every service, so its
 *          absence means gen has not run; an empty one with nothing compiled is.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0533 (decision 3); STA-2866.
 */
import { describe, expect, it } from "@stackra/testing";

import { streamIsCurrent } from "#core/functions/stream-is-current.function";
import type { MigrationStream } from "#core/types/migration-stream.type";

/** A stream of `member` whose migration `id` became `files`, with `compiled` on disk. */
const stream = (
  member: string,
  id: string,
  files: readonly string[],
  compiled: readonly string[] = files,
): MigrationStream => ({
  member,
  safety: {
    schema: "stackra.migration-safety/v1",
    migrations: [{ id, destructive: false, files: [...files] }],
  },
  compiled,
});

describe("streamIsCurrent", () => {
  it("needs the classes to list exactly the compiled files", () => {
    expect(streamIsCurrent(stream("a", "a.0001_x", ["0001_a_0001_x_1", "0002_a_0001_x_2"]))).toBe(
      true,
    );
    expect(streamIsCurrent(stream("a", "a.0001_x", ["0001_a_0001_x"], ["0001_a_0001_y"]))).toBe(
      false,
    );
    expect(
      streamIsCurrent(
        stream("a", "a.0001_x", ["0001_a_0001_x", "0001_a_0001_x"], ["0001_a_0001_x"]),
      ),
    ).toBe(false);
  });

  /** A fresh checkout has no `.stackra/` (gitignored): no safety file and nothing compiled is "gen has not run". */
  it("never takes a stream with no safety file as current", () => {
    expect(streamIsCurrent({ member: "a", safety: undefined, compiled: [] })).toBe(false);
    expect(streamIsCurrent({ member: "a", safety: undefined, compiled: ["0001_a_0001_x"] })).toBe(
      false,
    );
  });

  /** gen's empty classification of a service with no migration is what says "nothing to ship". */
  it("takes an empty safety file with nothing compiled as current", () => {
    const empty = { schema: "stackra.migration-safety/v1" as const, migrations: [] };
    expect(streamIsCurrent({ member: "a", safety: empty, compiled: [] })).toBe(true);
    expect(streamIsCurrent({ member: "a", safety: empty, compiled: ["0001_a_0001_x"] })).toBe(
      false,
    );
  });
});
