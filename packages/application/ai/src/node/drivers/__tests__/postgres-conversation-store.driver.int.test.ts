/**
 * Stackra file contract:
 * Purpose: integration tests of a subject's erasure in the ai stores on real Postgres: a conversation with a run cannot
 *          be deleted on its own (ai.0001's run-to-conversation key has no cascade, so the old `forget` rolled the
 *          erasure back); `PostgresConversationStoreDriver.forget` removes the person's conversations with their runs,
 *          steps, tool calls and approvals; `PostgresRunStoreDriver.forget` removes a run an agent ran for them in
 *          another conversation; another person's rows stay.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers, or the Testbed's Postgres. Every ai migration is
 *           applied and the generated entities registered; each call runs in the scope's isolation, as an action would.
 *           No message is written: its content is sealed by the boot's subscriber, which this test does not register.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0100 (decision 9); OS ADR 0067 d12 (privacy erasure)
 */
import { ActorKind, type Actor, type PublicId, Realm, type ScopeRef } from "@stackra/contracts";
import { compileMigration, CrudService, registerModelPartners } from "@stackra/database";
import { usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { asTenant } from "@stackra/tenancy/testing";
import { describe, expect, it } from "@stackra/testing";

import { RunApprovalStatus } from "#contracts/enums/run-approval-status.enum";
import { RunStatus } from "#contracts/enums/run-status.enum";
import { ToolCallOutcome } from "#contracts/enums/tool-call-outcome.enum";
import { CreateAiTablesMigration } from "#node/database/migrations/0001-create-ai-tables.migration";
import { DropEmbeddingsMigration } from "#node/database/migrations/0002-drop-embeddings.migration";
import { AppendOnlyAiTablesMigration } from "#node/database/migrations/0003-append-only-ai-tables.migration";
import { AddClientToolParkMigration } from "#node/database/migrations/0004-add-client-tool-park.migration";
import { RunStepsAppendOnlyMigration } from "#node/database/migrations/0005-run-steps-append-only.migration";
import { RenameRunPoliciesMigration } from "#node/database/migrations/0006-rename-run-policies.migration";
import { PostgresConversationStoreDriver } from "#node/drivers/postgres-conversation-store.driver";
import { PostgresRunStoreDriver } from "#node/drivers/postgres-run-store.driver";
import { AI_ENTITIES } from "#node/entities.gen";
import { Conversation } from "#node/models/conversation.model";
import { Message } from "#node/models/message.model";
import { RunApproval } from "#node/models/run-approval.model";
import { RunStep } from "#node/models/run-step.model";
import { Run } from "#node/models/run.model";
import { ToolCall } from "#node/models/tool-call.model";

/** The conversation rows. */
class Conversations extends CrudService<Conversation> {}

/** The message rows. */
class Messages extends CrudService<Message> {}

/** The run rows. */
class Runs extends CrudService<Run> {}

/** The step rows. */
class Steps extends CrudService<RunStep> {}

/** The tool call rows. */
class Calls extends CrudService<ToolCall> {}

/** The approval rows. */
class Decisions extends CrudService<RunApproval> {}

registerModelPartners([
  [Conversations, Conversation],
  [Messages, Message],
  [Runs, Run],
  [Steps, RunStep],
  [Calls, ToolCall],
  [Decisions, RunApproval],
]);

const postgres = usePostgres({
  entities: AI_ENTITIES,
  migrations: [
    CreateAiTablesMigration,
    DropEmbeddingsMigration,
    AppendOnlyAiTablesMigration,
    AddClientToolParkMigration,
    RunStepsAppendOnlyMigration,
    RenameRunPoliciesMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "ai",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

/** The tenant. */
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2f1", path: "platform.acme" };

/** The person to erase. */
const ANA = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2f2",
  realm: Realm.Staff,
} as const;

/** Another person. */
const BOB = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2f3",
  realm: Realm.Staff,
} as const;

/** The two stores over fresh repositories. */
function stores() {
  const runs = new Runs();
  const steps = new Steps();
  const calls = new Calls();
  const decisions = new Decisions();
  return {
    conversations: new PostgresConversationStoreDriver(
      new Conversations(),
      new Messages(),
      runs,
      steps,
      calls,
      decisions,
    ),
    runs: new PostgresRunStoreDriver(runs, steps, calls, decisions),
    rows: new Conversations(),
  };
}

/** Runs `work` in the scope's isolation. */
const inScope = <T>(work: (s: ReturnType<typeof stores>) => Promise<T>): Promise<T> =>
  asTenant(SCOPE.id as PublicId<"scp">, () => work(stores()), { scope: SCOPE });

/** A conversation of `owner` with one run by `actor` that has a step, a tool call and an approval; its ids. */
function converse(owner: string, actor: Actor) {
  return inScope(async ({ conversations, runs }) => {
    const conversation = await conversations.open({ agent: "assistant", principalId: owner });
    const run = await runs.create({
      conversationId: conversation.id,
      agent: "assistant",
      actor,
      status: RunStatus.Completed,
    });
    await runs.recordStep({
      runId: run.id,
      index: 0,
      finishReason: "stop",
      inputTokens: 1,
      outputTokens: 1,
    });
    await runs.recordToolCall({
      runId: run.id,
      toolCallId: "call_1",
      tool: "orders.order.cancel@1",
      inputHash: "ab",
      outcome: ToolCallOutcome.ApprovalRequired,
      approvalId: `apr_${run.id}`,
      at: new Date(),
    });
    await runs.recordApproval({
      approvalId: `apr_${run.id}`,
      runId: run.id,
      toolCallId: "call_1",
      tool: "orders.order.cancel@1",
      status: RunApprovalStatus.Pending,
      at: new Date(),
    });
    return { conversationId: conversation.id, runId: run.id };
  });
}

/** How many rows each ai table holds that name `id`, read as row text. */
function rowsNaming(id: string): Promise<Record<string, number>> {
  return inScope(async () => {
    const counts: Record<string, number> = {};
    for (const table of ["conversations", "runs", "run_steps", "tool_calls", "run_approvals"]) {
      // oxlint-disable-next-line no-await-in-loop -- reason: one count per table, in order
      const [row] = (await postgres.database
        .em()
        .execute(`select count(*)::int as n from "ai"."${table}" as r where r::text like ?`, [
          `%${id}%`,
        ])) as { n: number }[];
      counts[table] = row?.n ?? 0;
    }
    return counts;
  });
}

describe(PostgresConversationStoreDriver, () => {
  it("cannot delete a conversation with a run on its own, which is why forget removes the runs first", async () => {
    const { conversationId } = await converse(ANA.id, ANA);
    await expect(
      inScope(({ rows }) => rows.purge({ id: conversationId } as never)),
    ).rejects.toThrow(/foreign key/i);
  });

  it("forgets the person's conversations with their runs, steps, tool calls and approvals, and no one else's", async () => {
    const mine = await converse(ANA.id, ANA);
    const theirs = await converse(BOB.id, BOB);
    expect(await inScope(({ conversations }) => conversations.forget(ANA.id))).toBeGreaterThan(0);

    expect(
      await inScope(({ conversations }) => conversations.get(mine.conversationId)),
    ).toBeUndefined();
    expect(await inScope(({ runs }) => runs.get(mine.runId))).toBeUndefined();
    const left = await inScope(() =>
      postgres.database
        .em()
        .execute(
          'select (select count(*)::int from "ai"."run_steps" where run_id = ?) as steps, (select count(*)::int from "ai"."tool_calls" where run_id = ?) as calls, (select count(*)::int from "ai"."run_approvals" where run_id = ?) as approvals',
          [mine.runId, mine.runId, mine.runId],
        ),
    );
    expect(left).toEqual([{ steps: 0, calls: 0, approvals: 0 }]);
    expect(await inScope(({ runs }) => runs.get(theirs.runId))).toBeDefined();
    expect(await rowsNaming(ANA.id)).toEqual({
      conversations: 0,
      runs: 0,
      run_steps: 0,
      tool_calls: 0,
      run_approvals: 0,
    });
  });
});

describe(PostgresRunStoreDriver, () => {
  it("forgets a run an agent ran for the person in someone else's conversation", async () => {
    const delegated = await converse(BOB.id, {
      kind: ActorKind.Agent,
      id: "agt_01j9z3k4m5n6p7q8r9s0t1v2f4",
      onBehalfOf: ANA,
    });
    const bobs = await converse(BOB.id, BOB);
    expect(await inScope(({ runs }) => runs.forget(ANA.id))).toBe(1);
    expect(await inScope(({ runs }) => runs.get(delegated.runId))).toBeUndefined();
    expect(await inScope(({ runs }) => runs.get(bobs.runId))).toBeDefined();
    expect((await rowsNaming(ANA.id))["runs"]).toBe(0);
    expect(await inScope(({ runs }) => runs.forget(ANA.id))).toBe(0);
  });
});
