/**
 * Stackra file contract:
 * Purpose: proves the pure helpers the web and native components share: `columnChooserOf` (one option per column,
 *          the row header disabled and never hidden, the ticked ids, the hidden ids of a new choice) and
 *          `conversationActionsOf` (pin or unpin, rename and delete, each only with its handler, each calling it).
 * Boundary: pure functions; the translator is a stand-in that returns the key with its values.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022; STA-1371.
 */
import type { ConversationSummary } from "#contracts/types/conversation-summary.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { columnChooserOf } from "#core/functions/column-chooser-of.function";
import { conversationActionsOf } from "#core/functions/conversation-actions-of.function";
import type { CatalogueText } from "#core/types/catalogue-text.type";

/** A translator that says which key it was asked for. */
const t = ((key: string) => key) as CatalogueText;

const COLUMNS: readonly TableColumn[] = [
  { id: "sku", label: "SKU" },
  { id: "name", label: "Name", isRowHeader: true },
  { id: "price", label: "Price" },
];

describe("columnChooserOf", () => {
  it("offers every column, the row header disabled, and ticks the shown ones", () => {
    const chooser = columnChooserOf(COLUMNS, ["price"]);
    expect(chooser.options).toEqual([
      { value: "sku", label: "SKU", isDisabled: false },
      { value: "name", label: "Name", isDisabled: true },
      { value: "price", label: "Price", isDisabled: false },
    ]);
    expect(chooser.shown).toEqual(["sku", "name"]);
  });

  it("hides every unticked column but the row header", () => {
    expect(columnChooserOf(COLUMNS, []).hiddenOf(["price"])).toEqual(["sku"]);
  });

  it("takes the first column as the row header when none is marked", () => {
    const plain = COLUMNS.map(({ id, label }) => ({ id, label }));
    const chooser = columnChooserOf(plain, []);
    expect(chooser.options[0]?.isDisabled).toBe(true);
    expect(chooser.hiddenOf([])).toEqual(["name", "price"]);
    expect(columnChooserOf([], []).options).toEqual([]);
  });
});

describe("conversationActionsOf", () => {
  const item: ConversationSummary = {
    id: "c1",
    title: "Refunds",
    updatedAt: "2026-10-30T09:00:00Z",
  };

  it("offers nothing without handlers", () => {
    expect(conversationActionsOf(item, {}, t)).toEqual([]);
  });

  it("offers pin, rename and delete in order, each calling its handler", () => {
    const onPinChange = vi.fn();
    const onRename = vi.fn();
    const onDelete = vi.fn();
    const items = conversationActionsOf(item, { onPinChange, onRename, onDelete }, t);
    expect(items.map((entry) => entry.id)).toEqual(["pin", "rename", "delete"]);
    expect(items[0]).toMatchObject({ icon: "pin" });
    expect(items[2]).toMatchObject({ tone: "danger" });
    for (const entry of items) (entry as { onPress?: () => void }).onPress?.();
    expect(onPinChange).toHaveBeenCalledWith("c1", true);
    expect(onRename).toHaveBeenCalledWith("c1");
    expect(onDelete).toHaveBeenCalledWith("c1");
  });

  it("offers unpin on a pinned conversation", () => {
    const onPinChange = vi.fn();
    const [pin] = conversationActionsOf({ ...item, isPinned: true }, { onPinChange }, t);
    expect(pin).toMatchObject({ icon: "pin-off" });
    (pin as { onPress?: () => void }).onPress?.();
    expect(onPinChange).toHaveBeenCalledWith("c1", false);
  });
});
