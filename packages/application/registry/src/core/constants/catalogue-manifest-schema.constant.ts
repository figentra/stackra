/**
 * Stackra file contract:
 * Purpose: `CATALOGUE_MANIFEST_SCHEMA`, the zod schema of `CatalogueManifest` that this package ships (its `X$`): the
 *          header of a published `stackra.manifest.json` and the identity fields of its `modules`, `actions`, `events`
 *          and `permissions`, the sections the catalogue checks read; and the catalogue fields a registry stores: a
 *          module's `enhances`, `intents` and `entitlement`, an action's `tool` (or `toolOff` reason), and an event's
 *          `webhook` opt-in, personal-data `dataClasses` and `thinFields`.
 * Boundary: every object is `loose`, so the open fields of an entry and the sections other targets add (`ui`,
 *           `settings`, ...) pass through unchecked. The four checked sections default to `[]`. Internal:
 *           `catalogue-manifest.schema.ts` registers it, and it is not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 20, 22 and 26: a package ships its own `X$`); ADR 0231 (snake_case keys);
 *                     ADR 0109 (decision 1: manifests are build artefacts); ADR 0360 (decision 4: tools); ADR 0134
 *                     (personal-data classes); ADR 0224 (webhooks); OS ADR 0037 d1 (one entitlement per module).
 */
import { DataClassification, Enum } from "@stackra/contracts";
import { z } from "zod";

/** One snake_case segment: a member or module key (`orders`, `loyalty_kit`). */
const KEY = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, "must be one snake_case segment");

/** A non-empty string. */
const TEXT = z.string().min(1);

/** A risk level, `L0` to `L4`. */
const RISK = z.string().regex(/^L[0-4]$/, "must be a risk level from L0 to L4");

/** The shipped `CatalogueManifest$`. */
export const CATALOGUE_MANIFEST_SCHEMA = z
  .object({
    member: KEY,
    package: TEXT,
    version: TEXT,
    modules: z
      .array(
        z
          .object({
            key: KEY,
            class: TEXT.exactOptional(),
            from: TEXT.exactOptional(),
            exports: z.array(TEXT).exactOptional(),
            dependsOn: z.array(KEY),
            enhances: z.array(KEY).exactOptional(),
            intents: z.array(TEXT).exactOptional(),
            entitlement: TEXT.exactOptional(),
          })
          .loose(),
      )
      .default(() => []),
    actions: z
      .array(
        z
          .object({
            key: TEXT,
            kind: z.enum(["action", "query"]),
            module: KEY,
            class: TEXT,
            permission: TEXT,
            risk: RISK,
            actors: z.array(TEXT).exactOptional(),
            // gen writes `{ name, default, hints }`; a hand-written manifest may say `true`.
            tool: z.union([z.boolean(), z.object({ name: TEXT }).loose()]).exactOptional(),
            toolOff: TEXT.exactOptional(),
          })
          .loose(),
      )
      .default(() => []),
    events: z
      .array(
        z
          .object({
            name: TEXT,
            module: KEY,
            class: TEXT,
            kind: TEXT,
            version: z.number().int().min(1).exactOptional(),
            webhook: z.boolean().exactOptional(),
            dataClasses: z.array(z.enum(Enum.values(DataClassification))).exactOptional(),
            thinFields: z.array(TEXT).exactOptional(),
          })
          .loose(),
      )
      .default(() => []),
    permissions: z.array(z.object({ key: TEXT, risk: RISK }).loose()).default(() => []),
  })
  .loose();
