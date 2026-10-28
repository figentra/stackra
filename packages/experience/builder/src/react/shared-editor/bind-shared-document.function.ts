/**
 * Stackra file contract:
 * Purpose: `bindSharedDocument(editor, doc)`, the co-edit binding: it keeps an `Editor` and a Yjs document in step, so
 *          each local change reaches the other editors of the room and each of theirs reaches this one.
 * Boundary: the Yjs layout is a `blocks` map of block id to a map of `block`, `props` (one entry per prop, so two
 *           people setting different props both win), `children` (an array of ids) and the query `input` when the
 *           node has one, plus `builder.root`, the root's id. An empty document is seeded from the editor's tree with
 *           a client id derived from the tree, so editors that seed the same tree at once write one identical update
 *           that merges as one. A document that already holds a tree wins over the editor's on bind. A remote change
 *           replaces the editor's tree (not undoable). The reader keeps to what `parseDocumentNode` accepts, so a
 *           peer's bad block never stops the sync: a block placed twice by two concurrent moves shows at its first
 *           place, and a block with a malformed id or key, nested deeper than `MAX_DOCUMENT_DEPTH` or past
 *           `MAX_DOCUMENT_BLOCKS` is not shown (it stays in the document). A remove that races a co-editor's insert
 *           under the removed block drops that insert. Loads Yjs, an optional peer shared with
 *           `@stackra/collaboration/react`.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decisions 4, 5 and 6: the co-edit binding, Yjs for full collaboration); ADR 0225
 *                     (decision 2); ADR 0227 (Yjs for shared documents only).
 */
import type { Json } from "@stackra/contracts";
import { applyUpdate, Array as YArray, Doc, encodeStateAsUpdate, Map as YMap } from "yjs";

import { type EditorChange, EditorChangeKind, type EditorNode } from "#contracts/index";
import {
  BLOCK_ID_PATTERN,
  BLOCK_KEY_PATTERN,
  type Editor,
  MAX_DOCUMENT_BLOCKS,
  MAX_DOCUMENT_DEPTH,
} from "#core/index";

/** The transaction origin of this binding's own writes, which it never reads back. */
const LOCAL_ORIGIN = Symbol("builder.local");

/** One block's shared fields, or `undefined` when the document holds no such block. */
function entryOf(blocks: YMap<unknown>, id: string): YMap<unknown> | undefined {
  const entry = blocks.get(id);
  return entry instanceof YMap ? (entry as YMap<unknown>) : undefined;
}

/** One block's shared children, or `undefined`. */
function childrenOf(blocks: YMap<unknown>, id: string): YArray<unknown> | undefined {
  const children = entryOf(blocks, id)?.get("children");
  return children instanceof YArray ? (children as YArray<unknown>) : undefined;
}

/** `index` as a whole position in a list of `length` items: 0 to `length`. */
function clamp(index: number, length: number): number {
  return Math.min(Math.max(Math.trunc(index) || 0, 0), length);
}

/** Writes `node` and every block nested in it into `blocks`. */
function put(blocks: YMap<unknown>, node: EditorNode): void {
  const props = new YMap<unknown>();
  for (const [name, value] of Object.entries(node.props)) props.set(name, value);
  const children = new YArray<unknown>();
  children.push(node.children.map((child) => child.id));
  const entry = new YMap<unknown>();
  entry.set("block", node.block);
  entry.set("props", props);
  entry.set("children", children);
  if (node.input !== undefined) entry.set("input", node.input);
  blocks.set(node.id, entry);
  for (const child of node.children) put(blocks, child);
}

/** Takes `id` out of every children list that holds it (two concurrent moves can place it twice). */
function unlink(blocks: YMap<unknown>, id: string): void {
  for (const key of blocks.keys()) {
    const children = childrenOf(blocks, key);
    if (children === undefined) continue;
    for (let index = children.length - 1; index >= 0; index -= 1)
      if (children.get(index) === id) children.delete(index, 1);
  }
}

/** Deletes `id` and the blocks nested in it from `blocks`. */
function drop(blocks: YMap<unknown>, id: string, depth = 1, seen = new Set<string>()): void {
  if (depth > MAX_DOCUMENT_DEPTH || seen.has(id)) return;
  seen.add(id);
  for (const child of childrenOf(blocks, id)?.toArray() ?? [])
    if (typeof child === "string") drop(blocks, child, depth + 1, seen);
  blocks.delete(id);
}

/** Mirrors one applied local change into `doc`. */
function write(doc: Doc, change: EditorChange): void {
  const blocks = doc.getMap<unknown>("blocks");
  switch (change.kind) {
    case EditorChangeKind.Insert: {
      const children = childrenOf(blocks, change.parentId);
      if (children === undefined) return;
      put(blocks, change.node);
      children.insert(clamp(change.index, children.length), [change.node.id]);
      return;
    }
    case EditorChangeKind.Remove: {
      unlink(blocks, change.id);
      drop(blocks, change.id);
      return;
    }
    case EditorChangeKind.Move: {
      unlink(blocks, change.id);
      const children = childrenOf(blocks, change.parentId);
      children?.insert(clamp(change.index, children.length), [change.id]);
      return;
    }
    case EditorChangeKind.SetProp: {
      const props = entryOf(blocks, change.id)?.get("props");
      if (!(props instanceof YMap)) return;
      if (change.value === undefined) props.delete(change.name);
      else props.set(change.name, change.value);
    }
  }
}

/** The tree `doc` holds, or `undefined` while it holds none. */
function read(doc: Doc): EditorNode | undefined {
  const rootId = doc.getMap<unknown>("builder").get("root");
  if (typeof rootId !== "string") return undefined;
  const blocks = doc.getMap<unknown>("blocks");
  const seen = new Set<string>();
  const visit = (id: string, depth: number): EditorNode | undefined => {
    const entry = entryOf(blocks, id);
    if (
      entry === undefined ||
      depth > MAX_DOCUMENT_DEPTH ||
      seen.size >= MAX_DOCUMENT_BLOCKS ||
      seen.has(id) ||
      !BLOCK_ID_PATTERN.test(id)
    )
      return undefined;
    seen.add(id);
    const block = entry.get("block");
    const props = entry.get("props");
    const children = entry.get("children");
    const input = entry.get("input");
    if (
      typeof block !== "string" ||
      !BLOCK_KEY_PATTERN.test(block) ||
      !(props instanceof YMap) ||
      !(children instanceof YArray)
    )
      return undefined;
    return {
      id,
      block,
      // reason: prop values and inputs are only ever written from `EditorNode`s, whose values are JSON
      props: Object.fromEntries((props as YMap<Json>).entries()),
      children: (children as YArray<unknown>).toArray().flatMap((child) => {
        const node = typeof child === "string" ? visit(child, depth + 1) : undefined;
        return node === undefined ? [] : [node];
      }),
      ...(input === undefined ? {} : { input: input as Json }),
    };
  };
  return visit(rootId, 1);
}

/** A 32-bit FNV-1a hash of `text`, as a Yjs client id. */
function clientIdOf(text: string): number {
  let hash = 0x81_1c_9d_c5;
  for (let index = 0; index < text.length; index += 1)
    // oxlint-disable-next-line unicorn/prefer-code-point -- hashes UTF-16 code units; code points would change every hash already issued
    hash = Math.imul(hash ^ text.charCodeAt(index), 0x01_00_01_93);
  return hash >>> 0;
}

/** The update that seeds an empty shared document with `root`. */
function seedOf(root: EditorNode): Uint8Array {
  const seed = new Doc();
  // The same tree gives the same client id and the same writes, so concurrent seeds are one identical update.
  seed.clientID = clientIdOf(JSON.stringify(root));
  seed.transact(() => {
    put(seed.getMap<unknown>("blocks"), root);
    seed.getMap<unknown>("builder").set("root", root.id);
  });
  return encodeStateAsUpdate(seed);
}

/**
 * Keeps `editor` and `doc` in step until the returned function is called.
 *
 * @returns stops mirroring both ways (idempotent).
 * @example
 * const doc = new Doc({ guid: page.id });
 * const unbindReplica = session.bind(room, yjsReplica(doc));
 * await snapshots.restore(room, yjsReplica(doc));
 * const unbind = bindSharedDocument(editor, doc);
 */
export function bindSharedDocument(editor: Editor, doc: Doc): () => void {
  const shared = read(doc);
  if (shared === undefined) applyUpdate(doc, seedOf(editor.state.root), LOCAL_ORIGIN);
  else editor.replace(shared);
  const stopLocal = editor.onChange((change) => {
    doc.transact(() => write(doc, change), LOCAL_ORIGIN);
  });
  const onUpdate = (_update: Uint8Array, origin: unknown): void => {
    if (origin === LOCAL_ORIGIN) return;
    const root = read(doc);
    if (root !== undefined) editor.replace(root);
  };
  doc.on("update", onUpdate);
  let bound = true;
  return () => {
    if (!bound) return;
    bound = false;
    stopLocal();
    doc.off("update", onUpdate);
  };
}
