/**
 * Stackra file contract:
 * Purpose: pins what the committed `stackra.manifest.json` and `openapi.json` say about the activity module's
 *          surfaces: the feed is an HTTP route for a signed-in user and a read-only MCP tool for an agent; the
 *          retention job has neither (its only actor is the system) and runs from a per-tenant daily cron; and each
 *          notes event the listeners take is one the notes module publishes.
 * Boundary: unit tier; reads the committed files, so a change of a surface that was not regenerated (or a regeneration
 *           that silently adds an endpoint or a tool to the job) fails here.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (identities are derived and locked in the manifest); ADR 0155 (queries are MCP
 *                     tools); ADR 0305 (rule 28: the job surface); ADR 0148 (decision 5).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@stackra/testing";

interface ManifestAction {
  readonly key: string;
  readonly kind: "action" | "query";
  readonly actors: readonly string[];
  readonly risk: string;
  readonly permission: string;
  readonly effects?: readonly string[];
  readonly endpoint?: { readonly method: string; readonly path: string };
  readonly tool?: { readonly name: string; readonly hints: { readonly readOnlyHint: boolean } };
  readonly job?: {
    readonly cron?: { readonly schedule: string; readonly perScope?: boolean };
    readonly unique?: boolean;
  };
}

/** A committed file of the member, parsed. */
const committed = <T>(name: string): T =>
  JSON.parse(
    readFileSync(fileURLToPath(new URL(`../../../../${name}`, import.meta.url)), "utf8"),
  ) as T;

const manifest = committed<{
  readonly actions: readonly ManifestAction[];
  readonly events: readonly { readonly name: string }[];
}>("stackra.manifest.json");
const openapi = committed<{
  readonly paths: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
}>("openapi.json");

/** The manifest entry of one activity operation. */
function entry(key: string): ManifestAction {
  const found = manifest.actions.find((action) => action.key === key);
  if (found === undefined)
    throw new Error(`${key} is not in stackra.manifest.json: run stackra gen`);
  return found;
}

describe("stackra.manifest.json: the activity module's surfaces", () => {
  it("serves the feed over HTTP and as a read-only MCP tool, to users and agents", () => {
    const feed = entry("activity.activity_entry.list@1");
    expect(feed.actors).toEqual(["user", "agent"]);
    expect(feed.endpoint).toMatchObject({ method: "GET", path: "/app/activity-entries" });
    expect(feed.tool).toMatchObject({
      name: "activity_activity_entry_list",
      hints: { readOnlyHint: true },
    });
    expect([feed.permission, feed.risk]).toEqual(["activity.activity_entry.read", "L0"]);
    expect(Object.keys(openapi.paths["/app/activity-entries"] ?? {})).toEqual(["get"]);
  });

  it("runs the retention job from a per-tenant daily cron, with no endpoint and no tool", () => {
    const prune = entry("activity.activity_entry.prune@1");
    expect(prune.actors).toEqual(["system"]);
    expect(prune.endpoint).toBeUndefined();
    expect(prune.tool).toBeUndefined();
    expect(prune.effects).toEqual(["irreversible"]);
    expect(prune.job).toMatchObject({
      unique: true,
      cron: { schedule: "30 3 * * *", perScope: true },
    });
    expect([prune.permission, prune.risk]).toEqual(["activity.activity_entry.prune", "L2"]);
  });

  it("listens to events the notes module publishes", () => {
    const names = manifest.events.map((event) => event.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "notes.note.created.v1",
        "notes.note.updated.v1",
        "notes.note.deleted.v1",
      ]),
    );
  });
});
