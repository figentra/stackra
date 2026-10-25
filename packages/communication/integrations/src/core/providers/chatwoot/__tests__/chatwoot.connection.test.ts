/**
 * Stackra file contract:
 * Purpose: unit tests of `ChatwootConnection` and `ChatwootIntegration`: the description (per-region host, the
 *          token placeholder shared by the platform and the account), check, inbox, contact, conversation, message,
 *          assignment and status calls, and provisioning through the Platform API.
 * Boundary: test only; the managed client is `fakeIntegrationApi`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS-204, OS-206.
 */
import { describe, expect, it } from "@stackra/testing";

import { ChatwootConnection } from "#core/providers/chatwoot/chatwoot.connection";
import { ChatwootIntegration } from "#core/providers/chatwoot/chatwoot.integration";
import { integrationOptionsOf } from "#core/functions/integration-options-of.function";
import { fakeIntegrationApi } from "#testing/functions/fake-integration-api.function";
import { makeConnection } from "#testing/functions/make-connection.function";
import type { FakeIntegrationRoutes } from "#testing/types/fake-integration-routes.type";

const connect = (routes: (r: FakeIntegrationRoutes) => unknown) =>
  makeConnection(ChatwootConnection, {
    api: fakeIntegrationApi(ChatwootIntegration, routes),
    fields: { accountId: "7", accessToken: "account-token" },
  });

describe("Chatwoot", () => {
  it("describes a per-region host and one token placeholder", () => {
    const options = integrationOptionsOf(ChatwootIntegration);
    expect(options.baseUrl).toBe("https://{chatwootHost}");
    expect(options.auth).toEqual({
      type: "api_key",
      header: "api_access_token",
      format: "{accessToken}",
    });
  });

  it("checks the account and opens an inbox, a contact and a conversation", async () => {
    const bodies: unknown[] = [];
    const chatwoot = connect((r) =>
      r
        .get("/api/v1/accounts/7/inboxes")
        .returns(() => ({ payload: [] }))
        .post("/api/v1/accounts/7/inboxes")
        .returns((_p, { body }) => (bodies.push(body), { id: 3, inbox_identifier: "abc" }))
        .post("/api/v1/accounts/7/contacts")
        .returns(
          (_p, { body }) => (
            bodies.push(body),
            { payload: { contact: { id: 11 }, contact_inbox: { source_id: "src-1" } } }
          ),
        )
        .post("/api/v1/accounts/7/conversations")
        .returns((_p, { body }) => (bodies.push(body), { id: 21 })),
    );
    await expect(chatwoot.check()).resolves.toMatchObject({ id: "7" });
    const inbox = await chatwoot.createInbox("WhatsApp", "https://os.example/hooks/chatwoot");
    expect(inbox).toEqual({ id: "3", identifier: "abc" });
    const contact = await chatwoot.createContact("3", {
      identifier: "pty_1",
      name: "Lina",
      phone: "+966500000001",
    });
    expect(contact).toEqual({ contactId: "11", sourceId: "src-1" });
    await expect(chatwoot.openConversation("3", "11", "src-1")).resolves.toBe("21");
    expect(bodies).toEqual([
      {
        name: "WhatsApp",
        channel: { type: "api", webhook_url: "https://os.example/hooks/chatwoot" },
      },
      { inbox_id: 3, identifier: "pty_1", name: "Lina", phone_number: "+966500000001" },
      { inbox_id: 3, contact_id: 11, source_id: "src-1" },
    ]);
  });

  it("posts messages and notes, assigns and sets the status", async () => {
    const bodies: unknown[] = [];
    const record = (_p: unknown, { body }: { body: unknown }) => (bodies.push(body), { id: 5 });
    const chatwoot = connect((r) =>
      r
        .post("/api/v1/accounts/7/conversations/:id/messages")
        .returns(record)
        .post("/api/v1/accounts/7/conversations/:id/assignments")
        .returns(record)
        .post("/api/v1/accounts/7/conversations/:id/toggle_status")
        .returns(record),
    );
    await expect(
      chatwoot.postMessage("21", { content: "Hi", direction: "incoming" }),
    ).resolves.toBe("5");
    await chatwoot.postMessage("21", { content: "VIP", direction: "note" });
    await chatwoot.assign("21", "4");
    await chatwoot.setStatus("21", "resolved");
    expect(bodies).toEqual([
      { content: "Hi", message_type: "incoming", private: false },
      { content: "VIP", message_type: "outgoing", private: true },
      { assignee_id: 4 },
      { status: "resolved" },
    ]);
  });

  it("provisions an account with an administrator through the Platform API", async () => {
    const integration = new ChatwootIntegration();
    const calls: string[] = [];
    Object.defineProperty(integration, "api", {
      value: fakeIntegrationApi(ChatwootIntegration, (r) =>
        r
          .post("/platform/api/v1/accounts")
          .returns(() => (calls.push("account"), { id: 7 }))
          .post("/platform/api/v1/users")
          .returns(() => (calls.push("user"), { id: 9, access_token: "user-token" }))
          .post("/platform/api/v1/accounts/:id/account_users")
          .returns((_p, { body }) => (calls.push(JSON.stringify(body)), {})),
      ),
    });
    await expect(
      integration.provision({ name: "Acme", locale: "ar", email: "inbox+acme@platform.example" }),
    ).resolves.toEqual({ accountId: "7", userId: "9", accessToken: "user-token" });
    expect(calls).toEqual(["account", "user", '{"user_id":9,"role":"administrator"}']);
  });
});
