/**
 * Stackra file contract:
 * Purpose: unit tests of `Editor`: opening a document, the four changes, undo and redo (bounded, skipping steps a
 *          co-editor made impossible), the selection, state snapshots and listeners, `replace`, and `problems` against
 *          the registered blocks and their schemas.
 * Boundary: test only; the block classes are plain classes whose schemas are registered with `registerSchemas`, as gen
 *           does for real blocks.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decisions 1, 3 and 4).
 */
import type { AnyClass } from "@stackra/container";
import { isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { vi } from "vitest";
import { z } from "zod";

import { type EditorChange, EditorChangeKind } from "#contracts/index";
import { BlockNotFoundError } from "#core/errors/block-not-found.error";
import { BlockNotRegisteredError } from "#core/errors/block-not-registered.error";
import { DocumentInvalidError } from "#core/errors/document-invalid.error";
import { RootBlockLockedError } from "#core/errors/root-block-locked.error";
import { Editor } from "#core/values/editor.value";

class PageBlock {
  /** The page's heading. */
  title?: string;
}

class HeroSectionBlock {
  title!: string;
}

registerSchemas([
  [PageBlock, z.object({})],
  [HeroSectionBlock, z.object({ title: z.string() })],
]);

const BLOCKS: ReadonlyMap<string, AnyClass> = new Map<string, AnyClass>([
  ["web.page", PageBlock],
  ["web.hero_section", HeroSectionBlock],
]);

/** page > [hero, footer], as stored (a variable, so the ids pass where a `DocumentNode` is typed). */
const PAGE = {
  id: "page",
  block: "web.page",
  children: [
    { id: "hero", block: "web.hero_section", props: { title: "Hi" } },
    { id: "footer", block: "web.hero_section", props: { title: "Bye" } },
  ],
};

/** A co-editor's tree: the page with the footer only. */
const FOOTER_ONLY = {
  id: "page",
  block: "web.page",
  children: [{ id: "footer", block: "web.hero_section" }],
};

/** An editor on `PAGE`. */
function open(): Editor {
  return Editor.create({ root: PAGE, blocks: BLOCKS });
}

/** The ids of the root's children. */
function order(editor: Editor): readonly string[] {
  return editor.state.root.children.map((child) => child.id);
}

/** What `run` throws. */
function thrown(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe("Editor", () => {
  it("opens a parsed, frozen document with nothing selected and nothing to undo", () => {
    const editor = open();
    expect(order(editor)).toEqual(["hero", "footer"]);
    expect(editor.state).toEqual(
      expect.objectContaining({ selection: [], canUndo: false, canRedo: false }),
    );
    expect(Object.isFrozen(editor.state)).toBe(true);
    expect(editor.node("hero")?.props).toEqual({ title: "Hi" });
    expect(editor.node("nope")).toBeUndefined();
  });

  it("refuses a malformed document", () => {
    const error = thrown(() => Editor.create({ root: { block: "Not A Key" }, blocks: BLOCKS }));
    expect(isRefusal(error, DocumentInvalidError)).toBe(true);
  });

  it("inserts a registered block with a new id and refuses an unregistered one", () => {
    const editor = open();
    const id = editor.insert("page", 1, "web.hero_section", { title: "Mid" });
    expect(order(editor)).toEqual(["hero", id, "footer"]);
    expect(editor.node(id)).toEqual({
      id,
      block: "web.hero_section",
      props: { title: "Mid" },
      children: [],
    });
    expect(editor.state.canUndo).toBe(true);
    const refused = thrown(() => editor.insert("page", 0, "web.unknown"));
    expect(isRefusal(refused, BlockNotRegisteredError) && refused.details).toEqual({
      block: "web.unknown",
    });
    expect(
      isRefusal(
        thrown(() => editor.insert("nope", 0, "web.page")),
        BlockNotFoundError,
      ),
    ).toBe(true);
  });

  it("moves, removes and sets props, and keeps the root in place", () => {
    const editor = open();
    editor.move("footer", "page", 0);
    expect(order(editor)).toEqual(["footer", "hero"]);
    editor.setProp("hero", "title", "Hello");
    expect(editor.node("hero")?.props).toEqual({ title: "Hello" });
    editor.remove("footer");
    expect(order(editor)).toEqual(["hero"]);
    expect(
      isRefusal(
        thrown(() => editor.remove("page")),
        RootBlockLockedError,
      ),
    ).toBe(true);
    expect(
      isRefusal(
        thrown(() => editor.move("page", "hero", 0)),
        RootBlockLockedError,
      ),
    ).toBe(true);
  });

  it("undoes and redoes in order, and a new change clears the redo stack", () => {
    const editor = open();
    editor.setProp("hero", "title", "One");
    editor.setProp("hero", "title", "Two");
    expect(editor.undo()).toBe(true);
    expect(editor.node("hero")?.props).toEqual({ title: "One" });
    expect(editor.state.canRedo).toBe(true);
    expect(editor.redo()).toBe(true);
    expect(editor.node("hero")?.props).toEqual({ title: "Two" });
    editor.undo();
    editor.undo();
    expect(editor.node("hero")?.props).toEqual({ title: "Hi" });
    expect(editor.state.canUndo).toBe(false);
    editor.redo();
    editor.remove("footer");
    expect(editor.state.canRedo).toBe(false);
    expect(editor.redo()).toBe(false);
  });

  it("does nothing and notifies nobody when there is nothing to undo", () => {
    const editor = open();
    const listener = vi.fn();
    editor.subscribe(listener);
    expect(editor.undo()).toBe(false);
    expect(editor.redo()).toBe(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("skips a step whose block a co-editor removed, then turns undo off when none applies", () => {
    const editor = open();
    editor.setProp("hero", "title", "Mine");
    editor.replace(FOOTER_ONLY);
    expect(editor.state.canUndo).toBe(true);
    expect(editor.undo()).toBe(false);
    expect(editor.state.canUndo).toBe(false);
    expect(order(editor)).toEqual(["footer"]);
  });

  it("keeps at most 200 undo steps", () => {
    const editor = open();
    for (let step = 0; step < 201; step += 1) editor.setProp("hero", "title", `v${step}`);
    let undone = 0;
    while (editor.undo()) undone += 1;
    expect(undone).toBe(200);
    expect(editor.node("hero")?.props).toEqual({ title: "v0" });
  });

  it("selects blocks in the tree once each, keeps the array while it does not change and prunes removed blocks", () => {
    const editor = open();
    editor.select(["footer", "nope", "hero", "footer"]);
    const selection = editor.state.selection;
    expect(selection).toEqual(["footer", "hero"]);
    editor.select(["footer", "hero"]);
    expect(editor.state.selection).toBe(selection);
    editor.setProp("hero", "title", "x");
    expect(editor.state.selection).toBe(selection);
    editor.remove("footer");
    expect(editor.state.selection).toEqual(["hero"]);
    editor.select([]);
    expect(editor.state.selection).toEqual([]);
  });

  it("notifies subscribers with a new frozen state until they unsubscribe", () => {
    const editor = open();
    const listener = vi.fn();
    const unsubscribe = editor.subscribe(listener);
    const before = editor.state;
    editor.setProp("hero", "title", "x");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(editor.state).not.toBe(before);
    unsubscribe();
    editor.setProp("hero", "title", "y");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reports each applied local change, undo and redo included, but not a replaced tree", () => {
    const editor = open();
    const changes: EditorChange[] = [];
    const stop = editor.onChange((change) => changes.push(change));
    editor.setProp("hero", "title", "x");
    editor.undo();
    editor.replace(FOOTER_ONLY);
    expect(changes).toEqual([
      { kind: EditorChangeKind.SetProp, id: "hero", name: "title", value: "x" },
      { kind: EditorChangeKind.SetProp, id: "hero", name: "title", value: "Hi" },
    ]);
    stop();
    editor.insert("page", 0, "web.page");
    expect(changes).toHaveLength(2);
  });

  it("replaces the tree without making it undoable, and refuses a malformed one", () => {
    const editor = open();
    editor.replace(FOOTER_ONLY);
    expect(order(editor)).toEqual(["footer"]);
    expect(editor.state.canUndo).toBe(false);
    const malformed = JSON.parse('{"block":"web.page","children":3}') as typeof FOOTER_ONLY;
    expect(
      isRefusal(
        thrown(() => editor.replace(malformed)),
        DocumentInvalidError,
      ),
    ).toBe(true);
    expect(order(editor)).toEqual(["footer"]);
  });

  it("checks every block against the registered blocks and their schemas", () => {
    const editor = open();
    expect(editor.problems()).toEqual({});
    editor.setProp("hero", "title", 42);
    const stray = editor.insert("page", 0, "web.page");
    const withGhost = {
      ...editor.state.root,
      children: [...editor.state.root.children, { id: "ghost", block: "web.removed_block" }],
    };
    editor.replace(withGhost);
    expect(editor.problems()).toEqual({
      "hero.title": "invalid_type",
      ghost: "block_not_registered",
    });
    expect(editor.node(stray)).toBeDefined();
  });
});
