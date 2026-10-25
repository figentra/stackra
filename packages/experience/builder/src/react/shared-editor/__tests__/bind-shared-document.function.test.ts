/**
 * Stackra file contract:
 * Purpose: unit tests of `bindSharedDocument(editor, doc)`: an empty document is seeded from the editor and identical
 *          seeds merge as one; a document holding a tree wins on bind; every local change (undo included) reaches
 *          the other editor and theirs reach this one, not undoable and never echoed; two people setting different
 *          props both win; the query input survives; a peer's malformed block is not shown and the sync goes
 *          on; unbinding stops both ways.
 * Boundary: test only; plain Yjs documents, relayed in process (no collaboration session), with plain block classes.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decisions 4, 5 and 6); ADR 0225 (decision 2).
 */
import type { AnyClass } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";
import { applyUpdate, Doc, encodeStateAsUpdate, Map as YMap } from "yjs";

import { Editor } from "#core/index";
import { bindSharedDocument } from "#react/shared-editor/bind-shared-document.function";

class PageBlock {
  /** The page's heading. */
  title?: string;
}

const BLOCKS = new Map<string, AnyClass>([["web.page", PageBlock]]);

/** page > [hero, list], as stored; the list carries a query input. */
const PAGE = {
  id: "page",
  block: "web.page",
  children: [
    { id: "hero", block: "web.page", props: { title: "Hi" } },
    { id: "list", block: "web.page", input: { limit: 3 } },
  ],
};

/** Another document, to show which tree wins. */
const OTHER = { id: "elsewhere", block: "web.page" };

/** An editor opened on `root`. */
function editorOn(root: typeof PAGE | typeof OTHER): Editor {
  return Editor.create({ root, blocks: BLOCKS });
}

/** Sends every future update of each document to the other, tagged with its source. */
function relay(a: Doc, b: Doc): void {
  a.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== b) applyUpdate(b, update, a);
  });
  b.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin !== a) applyUpdate(a, update, b);
  });
}

/** Merges each document's state into the other, as a reconnect does. */
function exchange(a: Doc, b: Doc): void {
  const fromA = encodeStateAsUpdate(a);
  applyUpdate(a, encodeStateAsUpdate(b), "peer");
  applyUpdate(b, fromA, "peer");
}

/** Alice seeds her document; Bob's document gets her state and his editor binds to it. */
function pair() {
  const alice = editorOn(PAGE);
  const aliceDoc = new Doc();
  bindSharedDocument(alice, aliceDoc);
  const bob = editorOn(OTHER);
  const bobDoc = new Doc();
  applyUpdate(bobDoc, encodeStateAsUpdate(aliceDoc), "peer");
  bindSharedDocument(bob, bobDoc);
  relay(aliceDoc, bobDoc);
  return { alice, aliceDoc, bob, bobDoc };
}

describe("bindSharedDocument", () => {
  it("seeds an empty document from the editor, and a document holding a tree wins on bind", () => {
    const { alice, bob } = pair();
    expect(bob.state.root).toEqual(alice.state.root);
    expect(bob.state.root.id).toBe("page");
    expect(bob.state.canUndo).toBe(false);
  });

  it("merges identical seeds written at once as one", () => {
    const one = editorOn(PAGE);
    const two = editorOn(PAGE);
    const oneDoc = new Doc();
    const twoDoc = new Doc();
    bindSharedDocument(one, oneDoc);
    bindSharedDocument(two, twoDoc);
    exchange(oneDoc, twoDoc);
    expect(oneDoc.getMap("blocks").size).toBe(3);
    expect(one.state.root).toEqual(two.state.root);
    expect(one.state.root.children.map((child) => child.id)).toEqual(["hero", "list"]);
  });

  it("keeps the query input through the shared document", () => {
    const { bob } = pair();
    expect(bob.node("list")?.input).toEqual({ limit: 3 });
  });

  it("sends each local change, undo included, and takes the other editor's", () => {
    const { alice, bob } = pair();
    const id = alice.insert("page", 2, "web.page", { title: "New" });
    expect(bob.node(id)?.props).toEqual({ title: "New" });
    bob.move(id, "hero", 0);
    expect(alice.node("hero")?.children.map((child) => child.id)).toEqual([id]);
    alice.setProp("hero", "title", "Hello");
    expect(bob.node("hero")?.props).toEqual({ title: "Hello" });
    alice.undo();
    expect(bob.node("hero")?.props).toEqual({ title: "Hi" });
    bob.remove("list");
    expect(alice.node("list")).toBeUndefined();
    expect(alice.state.root).toEqual(bob.state.root);
  });

  it("does not make a remote change undoable and never echoes it", () => {
    const { alice, aliceDoc, bob } = pair();
    let updates = 0;
    aliceDoc.on("update", () => {
      updates += 1;
    });
    bob.setProp("hero", "title", "From Bob");
    expect(alice.node("hero")?.props).toEqual({ title: "From Bob" });
    expect(alice.state.canUndo).toBe(false);
    expect(updates).toBe(1);
  });

  it("lets two people set different props of one block at once", () => {
    const alice = editorOn(PAGE);
    const aliceDoc = new Doc();
    bindSharedDocument(alice, aliceDoc);
    const bob = editorOn(OTHER);
    const bobDoc = new Doc();
    applyUpdate(bobDoc, encodeStateAsUpdate(aliceDoc), "peer");
    bindSharedDocument(bob, bobDoc);
    alice.setProp("hero", "title", "Alice");
    bob.setProp("hero", "subtitle", "Bob");
    exchange(aliceDoc, bobDoc);
    expect(alice.node("hero")?.props).toEqual({ title: "Alice", subtitle: "Bob" });
    expect(bob.node("hero")?.props).toEqual({ title: "Alice", subtitle: "Bob" });
  });

  it("hides a peer's malformed block and keeps syncing", () => {
    const { alice, aliceDoc, bob } = pair();
    aliceDoc.transact(() => {
      const hero = aliceDoc.getMap("blocks").get("hero");
      if (hero instanceof YMap) hero.set("block", "Not A Key");
    }, "peer");
    expect(alice.node("hero")).toBeUndefined();
    expect(bob.node("hero")).toBeUndefined();
    bob.setProp("list", "title", "Still here");
    expect(alice.node("list")?.props).toEqual({ title: "Still here" });
  });

  it("stops mirroring both ways once unbound", () => {
    const alice = editorOn(PAGE);
    const doc = new Doc();
    const unbind = bindSharedDocument(alice, doc);
    unbind();
    unbind();
    alice.setProp("hero", "title", "Local only");
    const hero = doc.getMap("blocks").get("hero");
    expect(hero instanceof YMap && (hero.get("props") as YMap<unknown>).get("title")).toBe("Hi");
    doc.transact(() => doc.getMap("blocks").delete("list"), "peer");
    expect(alice.node("list")).toBeDefined();
  });
});
