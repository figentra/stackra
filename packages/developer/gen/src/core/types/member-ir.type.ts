/**
 * Stackra file contract:
 * Purpose: `MemberIR`, everything discovery read from one member: its facts, modules, kind classes, shapes, enums,
 *          file exports, its lang catalogues, the services its files import a client from, the committed manifests of its dependencies and of the services it injects a client of (and, for a relay service, of every publishing sibling), and which
 *          of those services exist in the workspace. Every gen output is a pure function of it.
 * Boundary: a type only. The committed `stackra.manifest.json` is the IR other members read (ADR 0127 2026-10-24
 *           note: `ir` folds into gen); this in-memory form never leaves a gen run.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10, 20 and 25); ADR 0295 (decisions 1 and 7); ADR 0305 (rules 15 and 16); ADR 0260
 *                     (decision 3: clients from the producer's manifest).
 */
import type { StackraManifest } from "@stackra/contracts";

import type { ClassRef } from "#core/types/class-ref.type";
import type { DeclaredClass } from "#core/types/declared-class.type";
import type { EnumIR } from "#core/types/enum-ir.type";
import type { FileExports } from "#core/types/file-exports.type";
import type { GenError } from "#core/types/gen-error.type";
import type { ShapeIR } from "#core/types/shape-ir.type";

/** What gen read from one member. */
export interface MemberIR {
  /** The member key: the folder name in snake_case. */
  readonly member: string;

  /** The package name. */
  readonly package: string;

  /** The package version. */
  readonly version: string;

  /** Where the member sits: a package (`src/node` is its module), a service or app (`src/modules/*`), a worker. */
  readonly layout: "package" | "service" | "app" | "worker";

  /** `app` when `stackra.config.ts` calls `defineApp`. */
  readonly kind?: "app";

  /** The `area` of `defineApp`. */
  readonly area?: string;

  /** The `targets` of `defineApp`. */
  readonly targets?: readonly string[];

  /** The authored root module, when the member writes one (ADR 0305 rule 15). */
  readonly rootModule?: ClassRef;

  /** The module keys, in source order of their folders. */
  readonly modules: readonly string[];

  /** Every kind class, sorted by file then name. */
  readonly classes: readonly DeclaredClass[];

  /** Every shape class. */
  readonly shapes: readonly ShapeIR[];

  /** Every `Enum.of` the member declares. */
  readonly enums: readonly EnumIR[];

  /** The exports of each source file. */
  readonly files: readonly FileExports[];

  /**
   * Every dependency package name (dependencies, then devDependencies), so the boot knows the platform packages a
   * member runs before they commit a manifest. Absent in an IR built by hand.
   */
  readonly packages?: readonly string[];

  /** The workspace and `@stackra/*` dependencies that commit a manifest, in package.json order. */
  readonly dependencies: readonly {
    readonly package: string;
    readonly manifest: StackraManifest;
  }[];

  /**
   * The committed manifests of the services the member injects a generated client of (`#stackra/clients/<service>`),
   * found beside the member, with the folder each sits in (absent in an IR built by hand: the service key is used).
   * Absent in an IR built by hand; the clients target also looks in `dependencies`.
   */
  readonly services?: readonly {
    readonly member: string;
    readonly folder?: string;
    readonly manifest: StackraManifest;
  }[];

  /**
   * The committed manifests of every other service beside the member that publishes an integration event, with the
   * folder each sits in. Read only for a member with a relay listener (ADR 0260 decision 4), whose events target
   * subscribes it to all of their topics. Absent otherwise and in an IR built by hand.
   */
  readonly publishers?: readonly {
    readonly member: string;
    readonly folder: string;
    readonly manifest: StackraManifest;
  }[];
  /**
   * The consumed services that exist beside the member (a folder with a package.json), with or without a committed
   * manifest. The manifest pass skips these instead of refusing them, since their manifests come in the same run.
   */
  readonly workspaceServices?: readonly string[];

  /**
   * The services any own source file (tests included) imports from `#stackra/clients/<service>`, with the first file
   * that does, so an app that only reads a client's queries in a route still gets the client file. Absent when none.
   */
  readonly clientImports?: readonly { readonly service: string; readonly file: string }[];

  /**
   * The lang catalogues under `assets/lang/<locale>/<namespace>.json`: locale to namespace to the parsed JSON. The
   * i18n target writes `#stackra/i18n` from it. Absent when the member has no `assets/lang`.
   */
  readonly catalogues?: Readonly<Record<string, Readonly<Record<string, unknown>>>>;

  /** What discovery refused. */
  readonly errors: readonly GenError[];
}
