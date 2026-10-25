// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useSharedEditor(room, options)`: `undefined` until the restore finishes, then the
 *          editor seeded from its document or adopting the saved tree; co-editing with another session's editor both
 *          ways; saving on unmount; a failed restore thrown to the error boundary with nothing saved; a refused plan
 *          restoring and saving alone.
 * Boundary: test only; jsdom with Testing Library; collaboration's session and snapshot service on its memory drivers
 *           with a `fakeEntitlements` grant; Bob's editor is bound through his own session with `bindSharedDocument`.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decisions 4, 5 and 6); ADR 0225 (decision 2).
 */
import {
  CollaborationConfig,
  CollaborationSession,
  LiveCollaborationEntitlement,
  SnapshotService,
} from "@stackra/collaboration";
import type { CollaborationRoom } from "@stackra/collaboration/contracts";
import { yjsReplica } from "@stackra/collaboration/react";
import {
  MemoryPresenceChannelDriver,
  MemorySnapshotStoreDriver,
  MemorySyncTransportDriver,
} from "@stackra/collaboration/testing";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Container, type Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import type { PublicId } from "@stackra/contracts";
import type { EntitlementSource } from "@stackra/entitlements";
import { fakeEntitlements } from "@stackra/entitlements/testing";
import { afterEach, describe, expect, expectTypeOf, it } from "@stackra/testing";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import { vi } from "vitest";
import { applyUpdate, Doc, encodeStateAsUpdate } from "yjs";

import type { EditorState } from "#contracts/index";
import { Editor } from "#core/index";
import { bindSharedDocument } from "#react/shared-editor/bind-shared-document.function";
import { useSharedEditor } from "#react/shared-editor/use-shared-editor";

class PageBlock {
  /** The page's heading. */
  title?: string;
}

const BLOCKS = new Map<string, AnyClass>([["web.page", PageBlock]]);

const ROOM: CollaborationRoom = { document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" };
const BOB: PublicId = "usr_01j9z3k4m5n6p7q8r9s0t1v2wb";

/** The draft the content service hands the editor, as stored. */
const DRAFT = {
  id: "page",
  block: "web.page",
  children: [{ id: "hero", block: "web.page", props: { title: "Hi" } }],
};

/** The tree a saved snapshot holds. */
const SAVED = { id: "page", block: "web.page", children: [{ id: "faq", block: "web.page" }] };

/** The viewer and Bob on one network, a shared store, and a provider binding the viewer's services. */
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

/** The state of a document whose editor seeded `root`. */
function stateOf(root: typeof SAVED): Uint8Array {
  const doc = new Doc();
  bindSharedDocument(Editor.create({ root, blocks: BLOCKS }), doc);
  return encodeStateAsUpdate(doc);
}

/** The tree the latest snapshot in `store` holds. */
async function savedTree(store: MemorySnapshotStoreDriver): Promise<EditorState["root"]> {
  const doc = new Doc();
  applyUpdate(doc, (await store.latest(ROOM))?.state ?? new Uint8Array());
  const reader = Editor.create({ root: { block: "web.page" }, blocks: BLOCKS });
  bindSharedDocument(reader, doc);
  return reader.state.root;
}

/** A builder surface that only says whether its editor is ready. */
function Builder() {
  const shared = useSharedEditor(ROOM, { root: DRAFT, blocks: BLOCKS });
  return <span>{shared === undefined ? "loading" : "ready"}</span>;
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

describe("useSharedEditor", () => {
  it("is undefined until restored, then seeds the shared document from the draft", async () => {
    const { Wrapper } = await setup();
    const { result } = renderHook(() => useSharedEditor(ROOM, { root: DRAFT, blocks: BLOCKS }), {
      wrapper: Wrapper,
    });
    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current?.[0].root.children.map((child) => child.id)).toEqual(["hero"]);
    expect(result.current?.[1]).toBeInstanceOf(Editor);
    expectTypeOf(useSharedEditor).returns.toEqualTypeOf<
      readonly [EditorState, Editor] | undefined
    >();
  });

  it("adopts the saved tree over the draft", async () => {
    const { store, Wrapper } = await setup();
    await store.save(ROOM, { state: stateOf(SAVED), savedAt: new Date() });
    const { result } = renderHook(() => useSharedEditor(ROOM, { root: DRAFT, blocks: BLOCKS }), {
      wrapper: Wrapper,
    });
    await waitFor(() =>
      expect(result.current?.[0].root.children.map((child) => child.id)).toEqual(["faq"]),
    );
  });

  it("co-edits with another session's editor and saves on unmount", async () => {
    const { bob, store, Wrapper } = await setup();
    const bobEditor = Editor.create({ root: DRAFT, blocks: BLOCKS });
    const bobDoc = new Doc();
    bob.bind(ROOM, yjsReplica(bobDoc));
    bindSharedDocument(bobEditor, bobDoc);
    const { result, unmount } = renderHook(
      () => useSharedEditor(ROOM, { root: DRAFT, blocks: BLOCKS }),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => expect(result.current).toBeDefined());
    act(() => bobEditor.setProp("hero", "title", "From Bob"));
    await waitFor(() =>
      expect(result.current?.[1].node("hero")?.props).toEqual({ title: "From Bob" }),
    );
    act(() => {
      result.current?.[1].setProp("hero", "subtitle", "Mine");
    });
    await waitFor(() =>
      expect(bobEditor.node("hero")?.props).toEqual({ title: "From Bob", subtitle: "Mine" }),
    );
    unmount();
    expect((await savedTree(store)).children[0]?.props).toEqual({
      title: "From Bob",
      subtitle: "Mine",
    });
  });

  it("throws a failed restore to the error boundary and never saves", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { store, Wrapper } = await setup();
    vi.spyOn(store, "latest").mockRejectedValue(new Error("store down"));
    const save = vi.spyOn(store, "save");
    render(
      <Wrapper>
        <Boundary>
          <Builder />
        </Boundary>
      </Wrapper>,
    );
    expect(await screen.findByText("failed")).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });

  it("restores and saves alone when the plan refuses live collaboration", async () => {
    const { bob, store, Wrapper } = await setup(fakeEntitlements());
    const bobDoc = new Doc();
    bob.bind(ROOM, yjsReplica(bobDoc));
    const { result, unmount } = renderHook(
      () => useSharedEditor(ROOM, { root: DRAFT, blocks: BLOCKS }),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => expect(result.current).toBeDefined());
    act(() => {
      result.current?.[1].setProp("hero", "title", "Alone");
    });
    expect(bobDoc.getMap("blocks").size).toBe(0);
    unmount();
    expect((await savedTree(store)).children[0]?.props).toEqual({ title: "Alone" });
  });
});
