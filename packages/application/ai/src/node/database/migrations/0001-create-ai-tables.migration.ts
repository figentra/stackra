/**
 * Stackra file contract:
 * Purpose: the first migration of the ai package: the eight tables of ADR 0100 decision 10 in the `ai` schema —
 *          `conversations`, `messages`, `runs`, `steps`, `tool_calls`, `approvals`, `embeddings` and `a2a_tasks` —
 *          each owned by a tenant under the forced equality policy, with the pgvector column of `embeddings`.
 * Boundary: a frozen snapshot, never edited once on main: it imports only @stackra/database and every name is a
 *           literal. ADR 0100's `ai_<name>` tables are `ai.<name>` here: the module's schema carries the prefix (ADR
 *           0399). `t.belongsToTenant()` is @stackra/tenancy's partner macro (the column, its index and the policy).
 *           Message content is sealed text, never plain; runs, steps and tool calls hold no text. The blueprint has no
 *           vector column, so `embedding` is added by SQL in the same transaction, `vector` with no fixed dimension
 *           (one table serves any embedder). No `down()`: gen derives the dev inverse.
 * Runtime: node
 * Governing contract: ADR 0100 (decisions 9 and 10); ADR 0399 (storage home); ADR 0159 (as amended: snapshots,
 *                     partner macros, comments and nullability); ADR 0160 (pgvector); ADR 0239; R-16.
 */
import { type Blueprint, Extension, Migration, type SchemaBuilder } from "@stackra/database";

/** Creates the ai tables. */
export class CreateAiTablesMigration extends Migration {
  /** The eight tables, their indexes and policies, then the embedding column. */
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Vector);
    schema.create("conversations", (t: Blueprint) => {
      t.hasPublicId("aiconv");
      t.belongsToTenant();
      t.timestamps();
      t.string("agent", 64).notNull().comment("The agent's key.");
      t.string("principal_id", 64)
        .notNull()
        .comment("The human principal it belongs to: the public id the agent acts for.");
      t.string("scope_id", 33)
        .nullable()
        .comment("The scope node it was opened in; null for a platform conversation.");
      t.string("record_kind", 64)
        .nullable()
        .comment("The kind of record it is about (matter); null when none.");
      t.string("record_id", 64)
        .nullable()
        .comment("The public id of the record it is about; null when none.");
      t.index(["tenant_id", "principal_id", "created_at"]);
    });
    schema.create("messages", (t: Blueprint) => {
      t.hasPublicId("aimsg");
      t.belongsToTenant();
      t.belongsTo("conversations", { column: "conversation_id" })
        .notNull()
        .comment("The conversation's public id.");
      t.string("run_id", 64).notNull().comment("The run that wrote it.");
      t.integer("position").notNull().comment("Its place in the conversation, from 0.");
      t.string("role", 16).notNull().comment("The message role (user, assistant, tool).");
      t.string("content")
        .notNull()
        .comment("The ModelMessage as JSON, sealed with the tenant's key; never plain text.");
      t.timestamp("at").notNull().comment("When it was stored.");
      t.unique(["conversation_id", "position"]);
    });
    schema.create("runs", (t: Blueprint) => {
      t.hasPublicId("airun");
      t.belongsToTenant();
      t.timestamps();
      t.belongsTo("conversations", { column: "conversation_id" })
        .notNull()
        .comment("The conversation's public id.");
      t.string("agent", 64).notNull().comment("The agent's key.");
      t.jsonb("actor")
        .notNull()
        .comment("The acting agent principal, with the human in onBehalfOf.");
      t.jsonb("scope").nullable().comment("The scope node it acts in; null for a platform run.");
      t.string("record_kind", 64)
        .nullable()
        .comment("The kind of record it works in; null when none.");
      t.string("record_id", 64)
        .nullable()
        .comment("The public id of the record it works in; null when none or for a whole kind.");
      t.enum("status", ["queued", "running", "waiting_approval", "completed", "failed"])
        .notNull()
        .comment("Where it stands.");
      t.string("pending_approval_id", 64)
        .nullable()
        .comment("The approval it is parked on; null unless waiting.");
      t.string("pending_tool_call_id", 128)
        .nullable()
        .comment("The tool call it is parked on; null unless waiting.");
      t.integer("steps").notNull().default(0).comment("The steps taken so far.");
      t.string("error_code", 64)
        .nullable()
        .comment("The error or refusal code of a failed run; null otherwise.");
      t.timestamp("finished_at")
        .nullable()
        .comment("When it completed or failed; null while open.");
      t.index(["tenant_id", "status"]);
    });
    schema.create("steps", (t: Blueprint) => {
      t.hasPublicId("aistep");
      t.belongsToTenant();
      t.belongsTo("runs", { column: "run_id" }).notNull().comment("The run's public id.");
      t.integer("index").notNull().comment("The step's number in the run, from 0.");
      t.string("finish_reason", 32).notNull().comment("Why the model stopped this step.");
      t.integer("input_tokens").notNull().comment("The input tokens it used.");
      t.integer("output_tokens").notNull().comment("The output tokens it used.");
      t.unique(["run_id", "index"]);
    });
    schema.create("tool_calls", (t: Blueprint) => {
      t.hasPublicId("aitool");
      t.belongsToTenant();
      t.belongsTo("runs", { column: "run_id" }).notNull().comment("The run's public id.");
      t.string("tool_call_id", 128).notNull().comment("The model's tool call id.");
      t.string("tool", 160).notNull().comment("The action key it dispatched.");
      t.string("input_hash", 64)
        .notNull()
        .comment("The SHA-256 of the input's canonical JSON, hex; never the input.");
      t.enum("outcome", ["ok", "refused", "approval_required", "proposed"])
        .notNull()
        .comment("How it ended.");
      t.string("code", 64)
        .nullable()
        .comment("The refusal code of a refused call; null otherwise.");
      t.string("approval_id", 64)
        .nullable()
        .comment("The approval a parked call waits for; null otherwise.");
      t.timestamp("at").notNull().comment("When it ended.");
    });
    schema.create("approvals", (t: Blueprint) => {
      t.hasPublicId("aiappr");
      t.belongsToTenant();
      t.timestamps();
      t.string("approval_id", 64)
        .notNull()
        .comment("The parked request's id, from the approval gate; unique.");
      t.belongsTo("runs", { column: "run_id" }).notNull().comment("The run's public id.");
      t.string("tool_call_id", 128).notNull().comment("The parked tool call.");
      t.string("tool", 160).notNull().comment("The action key it dispatches.");
      t.enum("status", ["pending", "granted", "denied"]).notNull().comment("Where it stands.");
      t.unique(["approval_id"]);
    });
    schema.create("embeddings", (t: Blueprint) => {
      t.hasPublicId("aiemb");
      t.belongsToTenant();
      t.timestamps();
      t.belongsTo("conversations", { column: "conversation_id" })
        .notNull()
        .comment("The conversation's public id.");
      t.belongsTo("messages", { column: "message_id" })
        .notNull()
        .comment("The message it was made from.");
      t.string("embedder", 120)
        .notNull()
        .comment("The embedder's provider and model, so a query compares like with like.");
      t.string("content_hash", 64)
        .notNull()
        .comment("The SHA-256 of the embedded content, hex, so an unchanged re-embed is skipped.");
    });
    schema.create("a2a_tasks", (t: Blueprint) => {
      t.hasPublicId("aitask");
      t.belongsToTenant();
      t.timestamps();
      t.enum("direction", ["inbound", "outbound"])
        .notNull()
        .comment("Inbound: a remote agent asked us; outbound: we asked a remote agent.");
      t.string("remote_agent", 2048).notNull().comment("The remote agent's card URL.");
      t.string("remote_task_id", 128)
        .nullable()
        .comment("The task id on the remote side; null until it answers.");
      t.string("state", 32).notNull().comment("The A2A task state.");
      t.string("run_id", 64).nullable().comment("The local run it belongs to; null when none.");
    });
    schema.sql(`alter table "ai"."embeddings" add column "embedding" vector not null`, {
      inverse: `alter table "ai"."embeddings" drop column if exists "embedding"`,
    });
    schema.sql(
      `comment on column "ai"."embeddings"."embedding" is 'The embedding, compared by cosine distance.'`,
      { inverse: `comment on column "ai"."embeddings"."embedding" is null` },
    );
  }
}
