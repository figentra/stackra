// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useSharedDocument(room)`: one `Y.Doc` per document (guid = the document id),
 *          restored from the latest snapshot, co-edited with another replica both ways, saved on unmount; a failed
 *          restore throws to the error boundary and never saves; a refused room still restores and saves alone.
 * Boundary: test only; jsdom with Testing Library; the session and the snapshot service run on this package's memory
 *           drivers with a `fakeEntitlements` grant; the other replica is a plain `Y.Doc` bound through the session.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0225 (decision 2); ADR 0270 (decisions 5 and 6).
 */
import { buildConfig } from "@stackra/config";
import { Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import type { EntitlementSource } from "@stackra/entitlements";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Component, type ReactNode, useEffect } from "react";
import { vi } from "vitest";
import { applyUpdate, Doc, encodeStateAsUpdate } from "yjs";

import { CollaborationConfig } from "#config/collaboration.config";
import type { CollaborationRoom } from "#contracts/index";
import { CollaborationSession, LiveCollaborationEntitlement, SnapshotService } from "#core/index";
import { useSharedDocument } from "#react/shared-document/use-shared-document";
import { yjsReplica } from "#react/shared-document/yjs-replica.function";
import {
  MemoryPresenceChannelDriver,
  MemorySnapshotStoreDriver,
  MemorySyncTransportDriver,
} from "#testing/index";

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const BOB: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wb";

/** A viewer and Bob on one network, a shared store, and a provider binding the viewer's services. */
async function setup(
  source: EntitlementSource = fakeEntitlements([[LiveCollaborationEntitlement, true]]),
) {
  const config = buildConfig(CollaborationConfig);
  const presence = new MemoryPresenceChannelDriver();
  const sync = new MemorySyncTransportDriver();
  const store = new MemorySnapshotStoreDriver();
  const viewer = new CollaborationSession(config, presence, sync, source);
  const bob = new CollaborationSession(config, presence.peer(BOB), sync.peer(), source);
  const container = await Container.create([], {
    overrides: new Map<Token, object>([
      [CollaborationSession, viewer],
      [SnapshotService, new SnapshotService(config, store)],
    ]),
  });
  function Wrapper({ children }: { readonly children?: ReactNode }) {
    return <ContainerProvider container={container}>{children}</ContainerProvider>;
  }
  return { bob, store, Wrapper };
}

/** A document whose `title` text reads `text`. */
function docWith(text: string): Doc {
  const doc = new Doc();
  doc.getText("title").insert(0, text);
  return doc;
}

/** Shows `failed` for any error. */
class Boundary extends Component<{ readonly children?: ReactNode }, { readonly failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? <span>failed</span> : this.props.children;
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSharedDocument", () => {
  it("restores the latest snapshot into one Y.Doc per document", async () => {
    const { store, Wrapper } = await setup();
    await store.save(ROOM, { state: encodeStateAsUpdate(docWith("Home")), savedAt: new Date() });
    const { result, rerender } = renderHook(() => useSharedDocument({ ...ROOM }), {
      wrapper: Wrapper,
    });
    const doc = result.current;
    expect(doc.guid).toBe(ROOM.document);
    await waitFor(() => expect(doc.getText("title").toString()).toBe("Home"));
    rerender();
    expect(result.current).toBe(doc);
    expectTypeOf(useSharedDocument).returns.toEqualTypeOf<Doc>();
  });

  it("co-edits with another replica and saves local changes on unmount", async () => {
    const { bob, store, Wrapper } = await setup();
    const other = new Doc();
    bob.bind(ROOM, yjsReplica(other));
    const { result, unmount } = renderHook(() => useSharedDocument(ROOM), { wrapper: Wrapper });
    const doc = result.current;
    act(() => other.getText("title").insert(0, "Pricing"));
    await waitFor(() => expect(doc.getText("title").toString()).toBe("Pricing"));
    act(() => doc.getText("title").insert(7, " page"));
    expect(other.getText("title").toString()).toBe("Pricing page");
    unmount();
    const saved = new Doc();
    applyUpdate(saved, (await store.latest(ROOM))?.state ?? new Uint8Array());
    expect(saved.getText("title").toString()).toBe("Pricing page");
  });

  it("throws a failed restore to the error boundary and never saves", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { store, Wrapper } = await setup();
    vi.spyOn(store, "latest").mockRejectedValue(new Error("store down"));
    const save = vi.spyOn(store, "save");
    const docs: Doc[] = [];
    function Editor() {
      const doc = useSharedDocument(ROOM);
      useEffect(() => {
        docs.push(doc);
      }, [doc]);
      return <span>editor</span>;
    }
    render(
      <Wrapper>
        <Boundary>
          <Editor />
        </Boundary>
      </Wrapper>,
    );
    act(() => docs[0]?.getText("title").insert(0, "partial"));
    expect(await screen.findByText("failed")).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it("restores and saves alone when the plan refuses live collaboration", async () => {
    const { bob, store, Wrapper } = await setup(fakeEntitlements());
    const other = new Doc();
    bob.bind(ROOM, yjsReplica(other));
    await store.save(ROOM, { state: encodeStateAsUpdate(docWith("Draft")), savedAt: new Date() });
    const { result, unmount } = renderHook(() => useSharedDocument(ROOM), { wrapper: Wrapper });
    const doc = result.current;
    await waitFor(() => expect(doc.getText("title").toString()).toBe("Draft"));
    act(() => doc.getText("title").insert(5, "!"));
    expect(other.getText("title").toString()).toBe("");
    unmount();
    const saved = new Doc();
    applyUpdate(saved, (await store.latest(ROOM))?.state ?? new Uint8Array());
    expect(saved.getText("title").toString()).toBe("Draft!");
  });
});
