/**
 * Stackra file contract:
 * Purpose: `LoadedManifest`, a committed `stackra.manifest.json` as `loadManifest` returns it: every section a
 *          contract test reads is present (empty when the member has none) and an event's `broadcast` is typed, so a
 *          test writes `manifest.events.find(...)` and `event.broadcast?.permission` without guards.
 * Boundary: a type only, assignable to `StackraManifest`; other sections stay open.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 10: the committed manifest); ADR 0294 2026-10-23 item 7 (broadcast audience);
 *                     ADR 0269 (manifest helpers live in @stackra/gen/testing).
 */
import type { Json, StackraManifest } from "@stackra/contracts";

/** One section of the manifest, never absent. */
type Section<K extends "modules" | "actions" | "permissions" | "errors" | "models" | "drivers"> =
  NonNullable<StackraManifest[K]>;

/** A loaded manifest. */
export interface LoadedManifest {
  /** The generated-file notice. */
  readonly $comment?: string;

  /** The member key. */
  readonly member: string;

  /** The package name. */
  readonly package: string;

  /** The version gen wrote. */
  readonly version: string;

  /** `app` for an app member. */
  readonly kind?: string;

  /** The member's `ApiArea` code. */
  readonly area?: string;

  /** An app's `Target` codes. */
  readonly targets?: readonly string[];

  /** The member's modules, by key. */
  readonly modules: Section<"modules">;

  /** The actions and queries. */
  readonly actions: Section<"actions">;

  /** The events, each with its broadcast typed. */
  readonly events: readonly {
    readonly name: string;
    readonly module: string;
    readonly class: string;
    readonly kind: string;
    readonly version?: number;
    /** The realtime push of the event: its channel, the permission a session needs and who it reaches. */
    readonly broadcast?: {
      readonly channel?: string;
      readonly permission?: string;
      readonly audience?: string;
    };
    readonly [field: string]: unknown;
  }[];

  /** The derived permission keys. */
  readonly permissions: Section<"permissions">;

  /** The refusal codes. */
  readonly errors: Section<"errors">;

  /** The member's models, by key. */
  readonly models: Section<"models">;

  /** The member's drivers, by port. */
  readonly drivers: Section<"drivers">;

  /** The JSON Schemas of the member's shapes. */
  readonly schemas: Json;

  /** The sections other targets add. */
  readonly [section: string]: unknown;
}
